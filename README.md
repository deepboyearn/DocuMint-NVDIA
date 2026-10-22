# DocuMint — AI-Powered Multi-Format Document Extractor

A beginner-friendly MVP for uploading PDFs, images, and text documents; extracting structured fields; searching saved results; and exporting CSV/JSON.

## Stack
- Frontend: React + Vite
- API: FastAPI
- Database: PostgreSQL (or SQLite locally)
- Parsing: PyMuPDF for PDFs, Pillow + optional Tesseract OCR for images
- AI: optional local Ollama model; deterministic extraction fallback when Ollama is unavailable

> Important: this starter is a learning project, not a production legal/accounting system. Always review extracted data. Documents may contain sensitive personal or financial information.

## 1. Install prerequisites
- Python 3.10+
- Node.js 20+
- PostgreSQL (optional for local quick start)
- Optional OCR: install Tesseract OCR and ensure `tesseract` is on PATH.
- Optional local AI: install Ollama, start it, then pull a model, e.g. `ollama pull llama3.2`.

## 2. Start the backend
Open a terminal in `backend/`:

```bash
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
# macOS/Linux: cp .env.example .env
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

By default, SQLite is used so you can run immediately. To use PostgreSQL, edit `DATABASE_URL` in `.env`, for example:
`postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/documint`

Create the `documint` database in PostgreSQL first.

## 3. Start the frontend
Open another terminal in `frontend/`:

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173.

## 4. How the workflow works
1. Select a PDF, PNG, JPG, JPEG, or TXT file.
2. The browser uploads it to FastAPI.
3. The API extracts text from the file.
4. If Ollama is available, the API asks it to return JSON fields. If not, the fallback extractor identifies common fields.
5. The extracted JSON and original filename are saved to the database.
6. React displays the saved records. Search filters the table; Export downloads CSV or JSON.

### 5. Optional AI Setup (OpenRouter Integration)
DocuMint uses OpenRouter for advanced, cloud-based LLM data extraction. The AI step is completely optional — the built-in fallback extractor keeps the project fully usable even without an API key.

To enable OpenRouter AI extraction:
1. Get your API key from [OpenRouter Keys](https://openrouter.ai/workspaces/default/keys)[cite: 2].
2. Set the following variables in your `.env` file inside the `backend/` folder:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=[https://openrouter.ai/api/v1](https://openrouter.ai/api/v1)
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
AI_ENABLED=true

## 6. Suggested development milestones
- Milestone 1: run upload and see records in the table.
- Milestone 2: test with sample invoices and contracts.
- Milestone 3: improve OCR and extraction prompts.
- Milestone 4: add authentication, user-specific access, and Supabase Storage.
- Milestone 5: deploy frontend and API separately; use managed PostgreSQL and private object storage.

## Security checklist before real use
- Add login and authorization before exposing the app publicly.
- Validate file content and size, not only the extension.
- Store uploads in private object storage, not public buckets.
- Add retention/deletion controls and audit logs.
- Never treat AI output as verified legal or financial truth.
