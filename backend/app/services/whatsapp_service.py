from dotenv import load_dotenv
import os
import requests
from ..models.schemas import WhatsAppMessage, Language
from .scam_detector import detect_scam
from .voice_processor import VoiceProcessor

load_dotenv()

class WhatsAppService:
    def __init__(self):
        self.token = os.getenv("WHATSAPP_TOKEN")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.base_url = f"https://graph.facebook.com/v17.0/{self.phone_number_id}/messages"
        self.voice_processor = VoiceProcessor()

    def send_message(self, to_number: str, message: str) -> dict:
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }

            payload = {
                "messaging_product": "whatsapp",
                "to": to_number,
                "type": "text",
                "text": {"body": message}
            }

            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

        except Exception as e:
            raise Exception(f"Error sending WhatsApp message: {str(e)}")

    def send_voice_message(self, to_number: str, audio_url: str) -> dict:
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }

            payload = {
                "messaging_product": "whatsapp",
                "to": to_number,
                "type": "audio",
                "audio": {"link": audio_url}
            }

            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

        except Exception as e:
            raise Exception(f"Error sending WhatsApp voice message: {str(e)}")

    def process_incoming_message(self, message: WhatsAppMessage) -> dict:
        try:
            result = {
                "original_message": message,
                "detection_result": None,
                "response_sent": False
            }

            # Process the message based on type
            if message.message_type == "text":
                # Detect language if not provided
                language = Language.ENGLISH  # Default, can be enhanced with language detection
                
                # Detect scam
                detection_result = detect_scam(message.content, language)
                result["detection_result"] = detection_result

                # Prepare response message
                response_text = f"Scam Detection Result:\nRisk Level: {detection_result['risk_level']}\nConfidence: {detection_result['confidence']}\nExplanation: {detection_result['explanation']}"
                
                # Send response
                self.send_message(message.from_number, response_text)
                result["response_sent"] = True

            elif message.message_type == "audio":
                # Process voice message
                voice_result = self.voice_processor.process_voice_message(message.content)
                
                # Detect scam in transcribed text
                detection_result = detect_scam(voice_result["text"], voice_result["language"])
                result["detection_result"] = detection_result

                # Convert response to speech
                response_text = f"Scam Detection Result: Risk Level {detection_result['risk_level']}. {detection_result['explanation']}"
                audio_content = self.voice_processor.text_to_speech(response_text, voice_result["language"])
                
                # TODO: Upload audio content to a temporary storage and get URL
                # For now, we'll just send text response
                self.send_message(message.from_number, response_text)
                result["response_sent"] = True

            return result

        except Exception as e:
            raise Exception(f"Error processing WhatsApp message: {str(e)}") 