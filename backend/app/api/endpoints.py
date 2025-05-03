from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from ..models.schemas import (
    MessageRequest,
    URLRequest,
    VoiceRequest,
    DetectionResponse,
    VoiceResponse,
    WhatsAppWebhookRequest,
    Language
)
from ..services.scam_detector import detect_scam
from ..services.url_checker import URLChecker
from ..services.voice_processor import VoiceProcessor
from ..services.whatsapp_service import WhatsAppService
import os
import base64

router = APIRouter()
url_checker = URLChecker()
voice_processor = VoiceProcessor()
whatsapp_service = WhatsAppService()

@router.post("/check-message", response_model=DetectionResponse)
async def check_message(request: MessageRequest):
    try:
        # If no language is provided, detect it automatically
        if request.language is None:
            from ..services.scam_detector import detect_language
            detected_language = detect_language(request.text)
            language = detected_language
        else:
            language = request.language
            
        # Now use the detected or provided language
        result = detect_scam(request.text, language)
        
        # Generate audio response
        response_text = f"Scam Detection Result: Risk Level {result['risk_level']}. {result['explanation']}"
        audio_content = voice_processor.text_to_speech(response_text, result['language'])
        audio_base64 = base64.b64encode(audio_content).decode("ascii")
        
        # Add audio content to the result
        result['audio_base64'] = audio_base64
        
        print(result)
        return DetectionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-url", response_model=DetectionResponse)
async def check_url(request: URLRequest):
    try:
        print(request.url)
        result = url_checker.check_url(str(request.url))
        
        # Generate audio response
        response_text = f"Scam Detection Result: Risk Level {result['risk_level']}. {result['explanation']}"
        audio_content = voice_processor.text_to_speech(response_text, result['language'])
        audio_base64 = base64.b64encode(audio_content).decode("ascii")
        
        # Add audio content to the result
        result['audio_base64'] = audio_base64
        
        return DetectionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-voice", response_model=VoiceResponse)
async def check_voice(
    file: UploadFile = File(...),
    language: Language = Form(Language.ENGLISH)
):
    try:
        print("file: ", file)
        voice_result = voice_processor.process_voice_message(file, language)
        print("voice_result: ", voice_result)
        detection_result = detect_scam(voice_result["text"], voice_result["language"])

        response_text = f"Scam Detection Result: Risk Level {detection_result['risk_level']}. {detection_result['explanation']}"
        audio_content = voice_processor.text_to_speech(response_text, voice_result["language"])
        audio_base64 = base64.b64encode(audio_content).decode("ascii")

        return VoiceResponse(
            **detection_result,
            audio_url="",  # Not needed for file upload
            audio_base64=audio_base64
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def whatsapp_webhook(request: WhatsAppWebhookRequest):
    try:
        # Verify the webhook
        if request.object != "whatsapp_business_account":
            raise HTTPException(status_code=400, detail="Invalid webhook object")

        # Process each entry
        for entry in request.entry:
            for change in entry.get("changes", []):
                if change.get("field") == "messages":
                    message = change.get("value", {}).get("messages", [])[0]
                    
                    # Create WhatsAppMessage object
                    whatsapp_message = {
                        "from_number": message.get("from"),
                        "message_type": "text" if message.get("type") == "text" else "audio",
                        "content": message.get("text", {}).get("body") if message.get("type") == "text" else message.get("audio", {}).get("id"),
                        "timestamp": message.get("timestamp")
                    }
                    
                    # Process the message
                    result = whatsapp_service.process_incoming_message(whatsapp_message)
                    return {"status": "success", "result": result}

        return {"status": "success", "message": "Webhook processed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/webhook")
async def verify_webhook(mode: str, token: str, challenge: str):
    try:
        verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
        
        if mode and token:
            if mode == "subscribe" and token == verify_token:
                return int(challenge)
            else:
                raise HTTPException(status_code=403, detail="Invalid verification token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 