# DocuMint — AI-Powered Multi-Format Document Extractor

DocuMint is a beginner-friendly MVP that allows users to upload documents, extract structured information, search saved records, and export results as CSV or JSON.

Built with **React, Vite, FastAPI, and SQLite**, DocuMint demonstrates an end-to-end document processing workflow with optional OCR and AI-powered extraction.

<img width="1920" height="1452" alt="screencapture-localhost-5173-2026-10-19-22_46_54" src="https://github.com/user-attachments/assets/6ffb4a43-3c08-453d-b777-fd2227cc48d3" />


> [!IMPORTANT]
> DocuMint is a learning MVP, not a production-ready legal, accounting, or compliance system. Always review extracted information before using it for important decisions. Uploaded documents may contain sensitive personal or financial information.

## ✨ Features

- 📄 **Multi-format uploads** — Support for PDF, PNG, JPG, JPEG, and TXT files.
- 🔍 **Structured data extraction** — Extract useful fields from uploaded documents.
- 🤖 **Optional AI integration** — Enhance extraction using OpenRouter or Ollama.
- ⚙️ **Fallback extraction** — Continue processing documents when AI is unavailable.
- 🗂️ **Record management** — Save and retrieve extracted document data.
- 🔎 **Search functionality** — Find saved records by filename or extracted content.
- 📊 **Data export** — Export extracted results as CSV or JSON.
- 💾 **Local-first storage** — Use SQLite by default, with optional PostgreSQL support.
- 🧩 **Modular architecture** — Separate frontend and backend for easier development.

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Python + FastAPI |
| Database | SQLite / PostgreSQL |
| PDF Processing | PyMuPDF |
| Image Processing | Pillow |
| OCR | Tesseract (optional) |
| AI Integration | OpenRouter / Ollama (optional) |

## 📁 Project Structure

```text
DocuMint/
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

*Note: Adjust the structure above to match your actual project files.*

## 🚀 Getting Started

Follow these steps to run DocuMint locally.

### Prerequisites

Install the following tools before getting started:

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/downloads/)

Optional dependencies:

- [PostgreSQL](https://www.postgresql.org/download/) — For PostgreSQL-based storage.
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) — For optical character recognition.
- [Ollama](https://ollama.com/) — For local AI-powered extraction.

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd DocuMint
```

Replace `<YOUR_REPOSITORY_URL>` with your GitHub repository URL.

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it.

**Windows (Command Prompt):**

```bat
.venv\Scripts\activate.bat
```

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source .venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file.

**Windows:**

```bat
copy .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Make sure `.env.example` exists before copying it. Configure the required environment variables in `.env` if your application needs additional settings.

### 3. Configure the Database

DocuMint uses SQLite by default, so a separate database server should not be necessary when the backend is configured for SQLite.

To use PostgreSQL instead, update `DATABASE_URL` in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/documint
```

Install the PostgreSQL driver if it is not already included in your dependencies:

```bash
pip install "psycopg[binary]"
```

Create the database using PostgreSQL:

```sql
CREATE DATABASE documint;
```

Ensure the configured database URL matches your backend's database implementation and configuration.

### 4. Start the Backend

From the `backend/` directory, run:

```bash
uvicorn app.main:app --reload
```

The backend API should be available at:

- **API:** http://127.0.0.1:8000
- **Interactive API documentation:** http://127.0.0.1:8000/docs
- **Alternative API documentation:** http://127.0.0.1:8000/redoc

Keep this terminal running.

### 5. Set Up the Frontend

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal. By default, Vite commonly uses:

http://localhost:5173

If your frontend requires an API base URL, configure it according to your project's existing Vite environment variable setup.

## 🔄 How It Works

```text
Upload Document
      |
      v
Validate File
      |
      v
Extract Text
      |
      v
AI Extraction (Optional)
      |
      v
Fallback Extraction
      |
      v
Save Structured Data
      |
      v
Search and Review Records
      |
      v
Export as CSV or JSON
```

### Processing Workflow

1. The user uploads a PDF, image, or text file through the frontend.
2. The frontend sends the document to the FastAPI backend.
3. The backend validates the upload and extracts available text.
4. Optional AI processing identifies relevant structured fields.
5. If AI processing is unavailable, the fallback extractor attempts to identify common fields.
6. The extracted data and document metadata are saved to the database.
7. The frontend displays saved records for searching and review.
8. Users can export the available results as CSV or JSON.

*The actual fields extracted and processing steps depend on the implemented backend logic.*

## 🤖 Optional AI Configuration

DocuMint is designed to support AI-powered extraction without making AI a requirement for the core workflow.

### Option A: OpenRouter

1. Create an API key from the [OpenRouter API Keys page](https://openrouter.ai/settings/keys).
2. Add your configuration to `backend/.env`:

```env
AI_ENABLED=true
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=your_supported_model_id
```

Replace `your_supported_model_id` with a model ID supported by your OpenRouter account.

**Security note:** Never commit your API key or `.env` file to GitHub.

### Option B: Ollama

Ollama allows you to run supported language models locally.

1. Install [Ollama](https://ollama.com/).
2. Start the Ollama service.
3. Download a model, such as:

```bash
ollama pull llama3.2
```

4. Configure the backend to use the local model according to the AI provider settings implemented in your application.

> [!NOTE]
> Installing a model does not automatically enable Ollama integration. The backend must implement the appropriate provider connection and configuration.

## 📤 Exporting Data

DocuMint is designed to support exporting extracted records in the following formats:

- **CSV** — Useful for spreadsheets, reporting, and data analysis.
- **JSON** — Useful for APIs, integrations, and structured data processing.

The exported fields and available records depend on the application's implementation.

## 🔐 Security Considerations

Before deploying DocuMint publicly or using it with sensitive documents, consider implementing the following safeguards:

- [ ] Authentication and authorization.
- [ ] File size limits and content validation.
- [ ] Secure file handling and private storage.
- [ ] Protection against malicious or malformed documents.
- [ ] Rate limiting and request validation.
- [ ] Secrets management using environment variables.
- [ ] Data retention and document deletion controls.
- [ ] Audit logging for sensitive operations.
- [ ] Appropriate access controls for stored records.
- [ ] Human review of AI-generated or extracted information.

**Never treat AI-extracted data as verified truth.** Review important information before using it in legal, financial, or compliance-related workflows.

## 🗺️ Development Roadmap

- [ ] **Milestone 1:** Set up the frontend and backend.
- [ ] **Milestone 2:** Implement document uploads and text extraction.
- [ ] **Milestone 3:** Save extracted records in the database.
- [ ] **Milestone 4:** Implement record search and CSV/JSON exports.
- [ ] **Milestone 5:** Improve OCR accuracy and extraction prompts.
- [ ] **Milestone 6:** Add optional AI provider integrations.
- [ ] **Milestone 7:** Add authentication and user-specific document access.
- [ ] **Milestone 8:** Add automated tests and error handling.
- [ ] **Milestone 9:** Deploy the frontend and backend with secure storage and managed database infrastructure.

Update these checkboxes as features are implemented.

## 🧪 Testing

Before submitting changes, verify the following workflows:

- [ ] Upload a valid PDF.
- [ ] Upload a supported image.
- [ ] Upload a text file.
- [ ] Handle empty, malformed, or unsupported files appropriately.
- [ ] Verify extracted fields.
- [ ] Confirm records persist in the database.
- [ ] Search for saved records.
- [ ] Export records to CSV and JSON.
- [ ] Verify fallback behavior when AI is unavailable.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add your feature"
   ```

4. Push your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a pull request describing your changes.

## 📄 License

Choose a license before distributing the project. For example, if you want to use the MIT License, add a `LICENSE` file containing the appropriate license text.

## 👨‍💻 About the Project

DocuMint is a learning-focused project for exploring document processing, text extraction, database persistence, frontend development, and optional AI integration.

It provides a foundation for experimenting with intelligent document workflows while keeping the core application useful without a mandatory AI service.

---

**Built with React, FastAPI, and a passion for making document processing simpler.**
