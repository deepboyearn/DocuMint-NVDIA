import { useEffect, useMemo, useState } from 'react';

const API = 'https://documint-nvdia.onrender.com';
const prettyDate = value => value ? new Date(value).toLocaleString() : '—';
export default function App() {
  const [docs, setDocs] = useState([]);
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState([]); // एकाधिक फाइलों के लिए अरे
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);

  async function loadDocs(search = query) {
    try {
      const res = await fetch(`${API}/api/documents?q=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Could not load documents');
      setDocs(await res.json());
    } catch (e) { setError(`${e.message}. Is the FastAPI server running?`); }
  }
  useEffect(() => { loadDocs(''); }, []);

  // Batch Upload Function
  async function upload(e) {
    e.preventDefault();
    if (!files || files.length === 0) { setError('Choose at least one file first.'); return; }
    setBusy(true); setError(''); setNotice('');

    const body = new FormData();
    for (let i = 0; i < files.length; i++) {
      body.append('files', files[i]); // बैकएंड के List[UploadFile] से मैच करने के लिए 'files' नाम दिया है
    }

    try {
      // ध्यान दें: बैकएंड में /api/documents/batch वाला रूट होना चाहिए
      const res = await fetch(`${API}/api/documents/batch`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');

      setNotice(`Successfully processed ${files.length} document(s).`);
      setFiles([]);
      document.getElementById('fileInput').value = '';
      await loadDocs(query);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function removeDoc(id) {
    if (!confirm('Delete this saved document?')) return;
    try {
      const res = await fetch(`${API}/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setNotice('Document deleted.');
      if (selected?.id === id) setSelected(null);
      await loadDocs(query);
    } catch (e) { setError(e.message); }
  }

  const allFields = useMemo(() => {
    const keys = new Set();
    docs.forEach(d => Object.keys(d.extracted_json || {}).forEach(k => keys.add(k)));
    return [...keys];
  }, [docs]);

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
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">D</span><span>DocuMint<small>DOCUMENT INTELLIGENCE</small></span></a>
      <span className="status"><i /> Local workspace</span>
    </header>
    <main>
      <section className="hero">
        <div className="eyebrow">AI-POWERED DOCUMENT WORKFLOW</div>
        <h1>Documents in.<br /><span>Useful data out.</span></h1>
        <p>Extract key fields from invoices, contracts, resumes and more — then search and export your results.</p>
      </section>

      <section className="upload-card">
        <div className="section-heading"><div><span className="step">01</span><h2>Upload documents</h2></div><span className="muted">PDF · JPG · PNG · TXT</span></div>
        <form onSubmit={upload}>
          <label className="dropzone" htmlFor="fileInput">
            <span className="upload-icon">↑</span>
            <strong>{files.length > 0 ? `${files.length} file(s) selected` : 'Choose files to get started'}</strong>
            <span>{files.length > 0 ? 'Ready for batch processing' : 'Click to browse your device · Multiple allowed · Max 15 MB each'}</span>
            <input id="fileInput" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={e => setFiles(e.target.files ? Array.from(e.target.files) : [])} />
          </label>
          <div className="upload-actions"><span className="muted">Your files are processed by your local API.</span><button disabled={busy || files.length === 0}>{busy ? 'Processing Batch…' : 'Extract data ↗'}</button></div>
        </form>
        {error && <div className="message error">{error}</div>}
        {notice && <div className="message success">{notice}</div>}
      </section>

      <section className="results-section">
        <div className="section-heading"><div><span className="step">02</span><h2>Extracted documents</h2><span className="count">{docs.length}</span></div><div className="exports"><button className="secondary" onClick={exportCsv} disabled={!docs.length}>Export CSV ↓</button><button className="secondary" onClick={exportJson} disabled={!docs.length}>Export JSON ↓</button></div></div>
        <div className="toolbar"><div className="searchbox"><span>⌕</span><input value={query} placeholder="Search filename or extracted content…" onChange={e => { setQuery(e.target.value); loadDocs(e.target.value); }} /></div><span className="muted">Latest first</span></div>
        <div className="table-wrap"><table><thead><tr><th>DOCUMENT</th><th>TYPE</th><th>EXTRACTED SUMMARY</th><th>PROCESSED</th><th /></tr></thead>
          <tbody>{docs.map(d => <tr key={d.id}>
            <td><button className="file-link" onClick={() => setSelected(d)}><span className="file-icon">▤</span><span>{d.filename}<small>DOC-{String(d.id).padStart(4, '0')}</small></span></button></td>
            <td><span className={`type-pill ${d.document_type}`}>{d.document_type || 'general'}</span></td>
            <td className="summary">{summary(d.extracted_json)}</td>
            <td className="date">{prettyDate(d.created_at)}</td>
            <td><button className="delete" title="Delete document" onClick={() => removeDoc(d.id)}>×</button></td>
          </tr>)}
            {!docs.length && <tr><td colSpan="5" className="empty"><span>▤</span><strong>No documents yet</strong><p>Upload files above and your extracted fields will appear here.</p></td></tr>}</tbody>
        </table></div>
      </section>
      <footer><span>DocuMint <span className="muted">· Learning project MVP</span></span><span>Review AI-extracted values before relying on them.</span></footer>
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">DOCUMENT DETAILS</span><h2>{selected.filename}</h2></div><button className="close" onClick={() => setSelected(null)}>×</button></div><div className="detail-grid">{Object.entries(selected.extracted_json || {}).map(([k, v]) => <div className="detail" key={k}><span>{k.replaceAll('_', ' ')}</span><strong>{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v ?? '—')}</strong></div>)}</div><button className="primary-wide" onClick={() => download(`${selected.filename}.json`, JSON.stringify(selected, null, 2), 'application/json')}>Download this record as JSON</button></section></div>}
  </div>;
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