import { useEffect, useMemo, useState } from 'react';
import './styles.css';

const API = 'https://documint-nvdia.onrender.com';
const prettyDate = value => value ? new Date(value).toLocaleString() : '—';

export default function App() {
  const [docs, setDocs] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);

  async function loadDocs(search = query) {
    try {
      const res = await fetch(`${API}/api/documents?q=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Could not load documents');
      setDocs(await res.json());
    } catch (e) {
      setError(`${e.message}. Is the backend server running?`);
    }
  }

  useEffect(() => {
    loadDocs('');
  }, []);

  // Batch Upload Function
  async function upload(e) {
    e.preventDefault();
    if (!files || files.length === 0) {
      setError('Please choose at least one file to upload.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');

    const body = new FormData();
    for (let i = 0; i < files.length; i++) {
      body.append('files', files[i]);
    }

    try {
      const res = await fetch(`${API}/api/documents/batch`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');

      setNotice(`Successfully processed ${files.length} document(s).`);
      setFiles([]);
      const input = document.getElementById('fileInput');
      if (input) input.value = '';
      await loadDocs(query);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(id) {
    if (!confirm('Delete this saved document?')) return;
    try {
      const res = await fetch(`${API}/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setNotice('Document deleted successfully.');
      if (selected?.id === id) setSelected(null);
      await loadDocs(query);
    } catch (e) {
      setError(e.message);
    }
  }

  const allFields = useMemo(() => {
    const keys = new Set();
    docs.forEach(d => Object.keys(d.extracted_json || {}).forEach(k => keys.add(k)));
    return [...keys];
  }, [docs]);

  // Filtered documents by search and category chip
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      const matchesCategory = selectedCategory === 'all' || 
        (doc.document_type || 'general').toLowerCase() === selectedCategory.toLowerCase();
      
      const q = query.toLowerCase();
      const matchesQuery = !query || 
        doc.filename.toLowerCase().includes(q) ||
        (doc.document_type || '').toLowerCase().includes(q) ||
        JSON.stringify(doc.extracted_json || {}).toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [docs, selectedCategory, query]);

  function exportJson() {
    download('documint-export.json', JSON.stringify(docs, null, 2), 'application/json');
  }

  function exportCsv() {
    const fields = ['id', 'filename', 'document_type', ...allFields, 'created_at'];
    const rows = docs.map(d => fields.map(f => {
      let value = ['id', 'filename', 'document_type', 'created_at'].includes(f) ? d[f] : d.extracted_json?.[f];
      if (value && typeof value === 'object') value = JSON.stringify(value);
      return `"${String(value ?? '').replaceAll('"', '""')}"`;
    }).join(','));
    download('documint-export.csv', [fields.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8');
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const categories = ['all', 'invoice', 'contract', 'resume', 'receipt', 'general'];

  return (
    <div className="app-shell">
      {/* 1. STICKY PRIMARY NAVIGATION */}
      <header className="primary-nav">
        <div className="brand-wrap">
          <div className="brand-badge">D</div>
          <div className="brand-title">
            DocuMint
            <span className="brand-tag">INTELLIGENCE</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="status-indicator">
            <span className="status-dot" /> Local workspace
          </span>
          <button 
            className="btn-primary"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            Upload +
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <main className="main-content">
        {/* HERO SECTION */}
        <section className="hero-section">
          <span className="hero-eyebrow">AI-POWERED DOCUMENT WORKFLOW</span>
          <h1 className="type-display-xl hero-title">
            Documents in.<br />
            <span>Useful data out.</span>
          </h1>
          <p className="type-body-md hero-subtitle">
            Instantly extract structured intelligence from invoices, contracts, resumes and receipts — organize and export with Pinterest-inspired precision.
          </p>
        </section>

        {/* BATCH UPLOAD SECTION */}
        <section className="feature-card-soft">
          <div className="section-head-bar">
            <div className="section-step-title">
              <span className="step-num">01</span>
              <h2 className="type-heading-xl">Upload documents</h2>
            </div>
            <span className="type-caption-sm" style={{ color: 'var(--color-mute)' }}>
              PDF · JPG · PNG · TXT · Max 15MB each
            </span>
          </div>

          <form onSubmit={upload}>
            <label className="dropzone-label" htmlFor="fileInput">
              <div className="dropzone-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <strong className="type-body-strong" style={{ fontSize: 17 }}>
                {files.length > 0 ? `${files.length} document(s) selected` : 'Drag and drop files here, or click to browse'}
              </strong>
              <span className="type-body-sm" style={{ color: 'var(--color-ash)' }}>
                Multiple files supported for batch extraction
              </span>

              <input
                id="fileInput"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                style={{ display: 'none' }}
                onChange={e => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              />
            </label>

            {files.length > 0 && (
              <div className="selected-files-list">
                {files.map((file, idx) => (
                  <span key={idx} className="file-chip">
                    📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    <button
                      type="button"
                      className="file-chip-remove"
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="upload-actions-bar">
              <span className="type-caption-sm" style={{ color: 'var(--color-mute)' }}>
                Processed securely via your local backend API.
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                {files.length > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setFiles([])}
                  >
                    Clear selection
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={busy || files.length === 0}
                >
                  {busy ? 'Processing Batch…' : 'Extract data ↗'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="alert-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="alert-success">
              <span>✓</span>
              <span>{notice}</span>
            </div>
          )}
        </section>

        {/* EXTRACTED DOCUMENTS SECTION */}
        <section className="feature-card-white">
          <div className="section-head-bar">
            <div className="section-step-title">
              <span className="step-num">02</span>
              <h2 className="type-heading-xl">Extracted documents</h2>
              <span className="count-chip">{filteredDocs.length}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', backgroundColor: 'var(--color-surface-card)', borderRadius: 'var(--rounded-full)', padding: 4 }}>
                <button
                  className="filter-chip"
                  style={{
                    padding: '6px 14px',
                    backgroundColor: viewMode === 'grid' ? 'var(--color-ink)' : 'transparent',
                    color: viewMode === 'grid' ? '#ffffff' : 'var(--color-ink)'
                  }}
                  onClick={() => setViewMode('grid')}
                >
                  Cards
                </button>
                <button
                  className="filter-chip"
                  style={{
                    padding: '6px 14px',
                    backgroundColor: viewMode === 'table' ? 'var(--color-ink)' : 'transparent',
                    color: viewMode === 'table' ? '#ffffff' : 'var(--color-ink)'
                  }}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>

              <button
                className="btn-secondary"
                onClick={exportCsv}
                disabled={!docs.length}
              >
                Export CSV ↓
              </button>
              <button
                className="btn-secondary"
                onClick={exportJson}
                disabled={!docs.length}
              >
                Export JSON ↓
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="filter-chip-strip">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* VIEW: GRID CARDS (Pinterest Pin Card Style with 16px radius) */}
          {viewMode === 'grid' && (
            <div className="doc-grid">
              {filteredDocs.map(d => (
                <div
                  key={d.id}
                  className="doc-card"
                  onClick={() => setSelected(d)}
                >
                  <div className="doc-card-head">
                    <div>
                      <span className="type-caption-sm" style={{ color: 'var(--color-mute)' }}>
                        DOC-{String(d.id).padStart(4, '0')}
                      </span>
                      <h3 className="type-body-strong" style={{ marginTop: 2, wordBreak: 'break-all' }}>
                        {d.filename}
                      </h3>
                    </div>
                    <span className={`doc-type-pill ${d.document_type || 'general'}`}>
                      {d.document_type || 'general'}
                    </span>
                  </div>

                  <div className="doc-card-body">
                    <div className="doc-summary-badge">
                      {summary(d.extracted_json)}
                    </div>
                  </div>

                  <div className="doc-card-foot">
                    <span>{prettyDate(d.created_at)}</span>
                    <button
                      className="btn-icon-circular"
                      style={{ width: 32, height: 32, minWidth: 32 }}
                      title="Delete document"
                      onClick={e => {
                        e.stopPropagation();
                        removeDoc(d.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {!filteredDocs.length && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 24px' }}>
                  <p className="type-heading-md" style={{ color: 'var(--color-mute)' }}>
                    No documents found matching this filter.
                  </p>
                  <p className="type-body-sm" style={{ marginTop: 6 }}>
                    Upload new files above or clear your search query.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW: TABLE VIEW (Clean Hairline Dividers) */}
          {viewMode === 'table' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>DOCUMENT</th>
                    <th>TYPE</th>
                    <th>EXTRACTED SUMMARY</th>
                    <th>PROCESSED</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map(d => (
                    <tr key={d.id}>
                      <td>
                        <button
                          className="doc-title-btn"
                          onClick={() => setSelected(d)}
                        >
                          <span style={{ fontSize: 18 }}>📄</span>
                          <div>
                            <span>{d.filename}</span>
                            <small>DOC-{String(d.id).padStart(4, '0')}</small>
                          </div>
                        </button>
                      </td>
                      <td>
                        <span className={`doc-type-pill ${d.document_type || 'general'}`}>
                          {d.document_type || 'general'}
                        </span>
                      </td>
                      <td>{summary(d.extracted_json)}</td>
                      <td style={{ color: 'var(--color-mute)' }}>{prettyDate(d.created_at)}</td>
                      <td>
                        <button
                          className="btn-icon-circular"
                          style={{ width: 32, height: 32, minWidth: 32 }}
                          title="Delete document"
                          onClick={() => removeDoc(d.id)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!filteredDocs.length && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-mute)' }}>
                        No documents yet. Upload files above to view extracted fields.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* 3. MODAL OVERLAY: {component.modal-card} - 32px Radius, 32px Padding, 50% Scrim */}
      {selected && (
        <div className="modal-scrim" onClick={() => setSelected(null)}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-head">
              <div>
                <span className="hero-eyebrow">DOCUMENT DETAILS</span>
                <h2 className="type-heading-lg" style={{ marginTop: 4, wordBreak: 'break-all' }}>
                  {selected.filename}
                </h2>
                <span className={`doc-type-pill ${selected.document_type || 'general'}`} style={{ marginTop: 8 }}>
                  {selected.document_type || 'general'}
                </span>
              </div>
              <button
                className="btn-icon-circular"
                onClick={() => setSelected(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="detail-grid">
              {Object.entries(selected.extracted_json || {}).map(([k, v]) => (
                <div className="detail-box" key={k}>
                  <span>{k.replaceAll('_', ' ')}</span>
                  <strong>{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v ?? '—')}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => download(`${selected.filename}.json`, JSON.stringify(selected, null, 2), 'application/json')}
              >
                Download record as JSON
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(JSON.stringify(selected, null, 2));
                  alert('JSON copied to clipboard!');
                }}
              >
                Copy JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER: 1px Hairline divider, quiet typography */}
      <footer className="footer-section">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-badge" style={{ width: 24, height: 24, fontSize: 13 }}>D</div>
            <strong style={{ color: 'var(--color-ink)' }}>DocuMint Intelligence</strong>
            <span>· Pinterest Design System</span>
          </div>
          <div>
            <span>Review AI-extracted values before production reliance.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function summary(data = {}) {
  const pieces = [];
  if (data.title) pieces.push(data.title);
  if (data.total) pieces.push(`Total: ${data.total}`);
  if (data.date) pieces.push(`Date: ${data.date}`);
  if (data.email) pieces.push(data.email);
  if (!pieces.length && data.key_points?.length) pieces.push(data.key_points.slice(0, 2).join(' · '));
  return pieces.join(' · ') || 'No summary fields detected';
}