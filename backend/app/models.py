from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(120), nullable=True)
    document_type = Column(String(50), default="unknown", nullable=False)
    extracted_text = Column(Text, nullable=True)
    extracted_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    category = Column(String, default="General")
tags = Column(String, default="[]")  # JSON string format में टैग्स सेव करेंगे
