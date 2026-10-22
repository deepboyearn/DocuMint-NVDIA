from pydantic import BaseModel, ConfigDict
from typing import Any
from datetime import datetime

class DocumentOut(BaseModel):
    id: int
    filename: str
    content_type: str | None = None
    document_type: str
    extracted_json: dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
