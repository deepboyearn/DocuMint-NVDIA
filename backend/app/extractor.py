import io
import json
import os
import re
from pathlib import Path

import fitz
from PIL import Image
from dotenv import load_dotenv

load_dotenv()
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt"}


def extract_text(data: bytes, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type. Upload PDF, PNG, JPG, JPEG, or TXT.")
    if ext == ".pdf":
        chunks = []
        with fitz.open(stream=data, filetype="pdf") as doc:
            for page in doc:
                chunks.append(page.get_text())
        text = "\n".join(chunks).strip()
        if text:
            return text
        try:
            import pytesseract
            with fitz.open(stream=data, filetype="pdf") as doc:
                for page in doc:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    image = Image.open(io.BytesIO(pix.tobytes("png")))
                    chunks.append(pytesseract.image_to_string(image))
            return "\n".join(chunks).strip()
        except Exception:
            return ""
    if ext in {".png", ".jpg", ".jpeg"}:
        try:
            import pytesseract
            return pytesseract.image_to_string(Image.open(io.BytesIO(data))).strip()
        except Exception as exc:
            raise ValueError(
                "Image OCR needs Tesseract installed and pytesseract available. " + str(exc)
            )
    return data.decode("utf-8", errors="replace").strip()


def detect_type(text: str, filename: str) -> str:
    t = (filename + " " + text[:4000]).lower()
    if any(x in t for x in ["invoice", "amount due", "subtotal", "tax", "bill to"]):
        return "invoice"
    if any(x in t for x in ["agreement", "whereas", "terms and conditions", "party hereto", "contract"]):
        return "contract"
    if any(x in t for x in ["resume", "curriculum vitae", "experience", "education", "skills"]):
        return "resume"
    return "general"


def fallback_extract(text: str, filename: str) -> dict:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    date_match = re.search(
        r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|20\d{2}-\d{2}-\d{2})\b", text
    )
    currency_matches = re.findall(r"(?:₹|INR|USD|\$|€|£)\s?\d[\d,]*(?:\.\d{2})?", text, re.I)
    email_match = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text)
    phone_match = re.search(r"(?<!\d)(?:\+?\d[\d ()-]{8,}\d)(?!\d)", text)
    total_match = re.search(
        r"(?:grand\s+total|total\s+due|amount\s+due|total)\s*[:\-]?\s*(?:₹|INR|USD|\$|€|£)?\s*([\d,]+(?:\.\d{2})?)",
        text, re.I
    )
    return {
        "title": lines[0][:180] if lines else filename,
        "document_type": detect_type(text, filename),
        "date": date_match.group(0) if date_match else None,
        "total": total_match.group(1).replace(",", "") if total_match else (
            currency_matches[-1] if currency_matches else None
        ),
        "currency_values": currency_matches[:20],
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0).strip() if phone_match else None,
        "line_items": [],
        "key_points": lines[:12],
        "note": "Fallback extraction. Review fields; check OpenRouter AI configuration."
    }


def ai_extract(text: str, filename: str) -> dict | None:
    """Use OpenRouter's OpenAI-compatible chat completions API."""
    if os.getenv("AI_ENABLED", "false").lower() != "true":
        return None

    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key or api_key.startswith("replace_with_"):
        print("OPENROUTER_API_KEY is missing; using fallback extraction.")
        return None

    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=api_key,
            base_url=os.getenv(
                "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
            ),
            timeout=90.0,
        )
        model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
        prompt = f"""Extract structured information from this document.
Return ONLY valid JSON with this schema:
{{
  "title": string|null,
  "document_type": "invoice"|"contract"|"resume"|"general"|"technical"|"financial",
  "category": string,
  "tags": [string],
  "date": string|null,
  "total": string|null,
  "currency": string|null,
  "vendor": string|null,
  "customer": string|null,
  "email": string|null,
  "phone": string|null,
  "line_items": [{{"description": string, "quantity": string|null, "unit_price": string|null, "amount": string|null}}],
  "key_points": [string]
}}
Do not invent missing values; use null or empty arrays.
Filename: {filename}
Document text:
{text[:18000]}"""
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract document fields accurately. Return valid JSON only."
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=2500,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content or "{}")
        if isinstance(result, dict):
            result.setdefault("document_type", detect_type(text, filename))
            return result
    except Exception as exc:
        print(f"OpenRouter extraction failed; using fallback extractor: {exc}")
    return None


def process_document(data: bytes, filename: str) -> tuple[str, dict]:
    text = extract_text(data, filename)
    if not text:
        raise ValueError(
            "No readable text found. For scanned PDFs/images, install Tesseract OCR and try again."
        )
    result = ai_extract(text, filename) or fallback_extract(text, filename)
    result["document_type"] = result.get("document_type") or detect_type(text, filename)
    return text, result