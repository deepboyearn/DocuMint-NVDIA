import json, os
from pathlib import Path
from fastapi import FastAPI, Depends, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from .database import Base, engine, get_db
from .models import Document
from .schemas import DocumentOut
from .extractor import process_document, ALLOWED_EXTENSIONS
from typing import List 

load_dotenv()
Base.metadata.create_all(bind=engine)
app = FastAPI(title="DocuMint API", version="1.0.0")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
MAX_BYTES = int(os.getenv("MAX_UPLOAD_MB", "15")) * 1024 * 1024

@app.get("/")
def root():
    return {"message": "DocuMint API is running", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/documents", response_model=DocumentOut)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = Path(file.filename or "upload").name
    if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Supported formats: PDF, PNG, JPG, JPEG, TXT")
    data = await file.read()
    if not data:
        raise HTTPException(400, "The uploaded file is empty.")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"File too large. Maximum size is {MAX_BYTES // (1024*1024)} MB.")
    try:
        text, extracted = process_document(data, filename)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    doc = Document(filename=filename, content_type=file.content_type, document_type=extracted.get("document_type", "general"),
                    extracted_text=text, extracted_json=json.dumps(extracted, ensure_ascii=False))
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {
        "id": doc.id, "filename": doc.filename, "content_type": doc.content_type,
        "document_type": doc.document_type, "extracted_json": extracted, "created_at": doc.created_at
    }

@app.get("/api/documents", response_model=list[DocumentOut])
def list_documents(q: str = "", db: Session = Depends(get_db)):
    query = db.query(Document)
    if q.strip():
        term = f"%{q.strip()}%"
        query = query.filter((Document.filename.ilike(term)) | (Document.extracted_text.ilike(term)) | (Document.extracted_json.ilike(term)))
    docs = query.order_by(Document.id.desc()).limit(500).all()
    return [{"id": d.id, "filename": d.filename, "content_type": d.content_type,
             "document_type": d.document_type, "extracted_json": json.loads(d.extracted_json),
             "created_at": d.created_at} for d in docs]

@app.get("/api/documents/{document_id}", response_model=DocumentOut)
def get_document(document_id: int, db: Session = Depends(get_db)):
    d = db.query(Document).filter(Document.id == document_id).first()
    if not d:
        raise HTTPException(404, "Document not found")
    return {"id": d.id, "filename": d.filename, "content_type": d.content_type,
            "document_type": d.document_type, "extracted_json": json.loads(d.extracted_json), "created_at": d.created_at}

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    d = db.query(Document).filter(Document.id == document_id).first()
    if not d:
        raise HTTPException(404, "Document not found")
    db.delete(d)
    db.commit()
    return {"message": "Document deleted"}

#bulk upload end point
@app.post("/api/documents/batch", response_model=list[DocumentOut])
async def upload_batch_documents(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    processed_docs = []
    for file in files:
        filename = Path(file.filename or "upload").name
        if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
            continue # या एरर थ्रो कर सकते हैं
        
        data = await file.read()
        if not data:
            continue
            
        try:
            text, extracted = process_document(data, filename)
        except Exception:
            continue
            
        doc = Document(
            filename=filename, 
            content_type=file.content_type, 
            document_type=extracted.get("document_type", "general"),
            extracted_text=text, 
            extracted_json=json.dumps(extracted, ensure_ascii=False)
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        processed_docs.append({
            "id": doc.id, "filename": doc.filename, "content_type": doc.content_type,
            "document_type": doc.document_type, "extracted_json": extracted, "created_at": doc.created_at
        })
        
    return processed_docs