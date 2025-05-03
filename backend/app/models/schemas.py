from pydantic import BaseModel, HttpUrl
from typing import Optional, Literal
from enum import Enum

class RiskLevel(str, Enum):
    SAFE = "safe"
    SUSPICIOUS = "suspicious"
    SCAM = "scam"

class Language(str, Enum):
    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"

class MessageRequest(BaseModel):
    text: str
    language: Optional[Language] = None

class URLRequest(BaseModel):
    url: HttpUrl

class VoiceRequest(BaseModel):
    audio_url: str
    language: Optional[Language] = None

class DetectionResponse(BaseModel):
    risk_level: RiskLevel
    confidence: float
    explanation: str
    language: Language
    translated_text: Optional[str] = None
    audio_base64: Optional[str] = None

class VoiceResponse(DetectionResponse):
    audio_url: Optional[str] = None
    audio_base64: Optional[str] = None

class WhatsAppWebhookRequest(BaseModel):
    object: str
    entry: list[dict]

class WhatsAppMessage(BaseModel):
    from_number: str
    message_type: Literal["text", "audio"]
    content: str
    timestamp: str 