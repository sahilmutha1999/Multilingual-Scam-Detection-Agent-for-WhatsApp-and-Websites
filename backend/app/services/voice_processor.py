from dotenv import load_dotenv
import os
import base64
import requests
from pydub import AudioSegment
from tempfile import NamedTemporaryFile
from ..models.schemas import Language
from fastapi import UploadFile

load_dotenv()

LANG_CODE_MAP = {
    Language.ENGLISH: "en-US",
    Language.SPANISH: "es-ES",
    Language.FRENCH: "fr-FR"
}

class VoiceProcessor:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Missing GOOGLE_API_KEY in environment variables.")
        self.simulated = False
        
        # Add these lines to set FFmpeg path
        ffmpeg_path = r"C:\Users\sahil\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-7.1.1-full_build\bin\ffmpeg.exe"
        ffprobe_path = r"C:\Users\sahil\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-7.1.1-full_build\bin\ffprobe.exe"
        
        AudioSegment.converter = ffmpeg_path
        AudioSegment.ffprobe = ffprobe_path

    def transcribe_audio(self, file: UploadFile, language: Language = Language.ENGLISH) -> str:
        try:
            wav_data = self._convert_mp3_to_wav_linear16(file)
            audio_base64 = base64.b64encode(wav_data).decode("utf-8")

            lang_code = LANG_CODE_MAP.get(language, "en-US")
            url = f"https://speech.googleapis.com/v1/speech:recognize?key={self.api_key}"

            body = {
                "config": {
                    "encoding": "LINEAR16",
                    "languageCode": lang_code,
                    "sampleRateHertz": 44100
                },
                "audio": {
                    "content": audio_base64
                }
            }

            response = requests.post(url, json=body)
            result = response.json()

            if "results" in result and result["results"]:
                return result["results"][0]["alternatives"][0]["transcript"]
            else:
                raise Exception("No transcription result from Google Speech API.")
        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")

    def text_to_speech(self, text: str, language: Language = Language.ENGLISH) -> bytes:
        try:
            lang_code = LANG_CODE_MAP.get(language, "en-US")
            url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={self.api_key}"

            body = {
                "input": {"text": text},
                "voice": {
                    "languageCode": lang_code,
                    "ssmlGender": "NEUTRAL"
                },
                "audioConfig": {
                    "audioEncoding": "MP3"
                }
            }

            response = requests.post(url, json=body)
            result = response.json()

            if "audioContent" in result:
                return base64.b64decode(result["audioContent"])
            else:
                raise Exception("No audio content returned from TTS.")

        except Exception as e:
            raise Exception(f"Error converting text to speech: {str(e)}")

    def process_voice_message(self, file: UploadFile, language: Language = None) -> dict:
        try:
            # Convert to LINEAR16 WAV (Google STT compatible)
            temp_wav = self._convert_audio_to_linear16_wav(file)
            print("temp_wav: ", temp_wav)

            # Read the converted wav data
            with open(temp_wav.name, "rb") as f:
                audio_data = f.read()

            audio_base64 = base64.b64encode(audio_data).decode("utf-8")
            lang_code = LANG_CODE_MAP.get(language, "en-US")
            print("lang_code: ", lang_code)

            url = f"https://speech.googleapis.com/v1/speech:recognize?key={self.api_key}"
            body = {
                "config": {
                    "encoding": "LINEAR16",
                    "languageCode": lang_code,
                    "sampleRateHertz": 16000,
                    "enableAutomaticPunctuation": True
                },
                "audio": {
                    "content": audio_base64
                }
            }

            response = requests.post(url, json=body)
            print("response status: ", response.status_code)
            print("response error: ", response.text)  # Print the actual error message
            result = response.json()

            if "results" in result and result["results"]:
                transcribed_text = result["results"][0]["alternatives"][0]["transcript"]
                return {
                    "text": transcribed_text,
                    "language": language or Language.ENGLISH
                }
            else:
                # Include error message if available
                error_detail = ""
                if "error" in result:
                    error_detail = f": {result['error'].get('message', '')}"
                raise Exception(f"No transcription result from Google Speech API{error_detail}")

        except Exception as e:
            raise Exception(f"Error processing voice message: {str(e)}")

    def _convert_audio_to_linear16_wav(self, file: UploadFile) -> NamedTemporaryFile:
        # Ensure file pointer is at start
        file.file.seek(0)
        
        # Save the uploaded file to a temporary file
        temp_input = NamedTemporaryFile(suffix=".mp3", delete=False)
        temp_input_path = temp_input.name
        
        try:
            # Read from the uploaded file and write to the temp file
            with open(temp_input_path, "wb") as f:
                f.write(file.file.read())
            
            # Now load from the file path
            print(f"Loading audio from temp file: {temp_input_path}")
            
            # Set explicit params for exact sample rate
            audio = AudioSegment.from_file(temp_input_path)
            
            # Print original audio parameters
            print(f"Original audio: channels={audio.channels}, frame_rate={audio.frame_rate}, sample_width={audio.sample_width}")
            
            # Convert to exact parameters needed by Google STT
            audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            
            # Print converted audio parameters
            print(f"Converted audio: channels={audio.channels}, frame_rate={audio.frame_rate}, sample_width={audio.sample_width}")

            temp_wav = NamedTemporaryFile(suffix=".wav", delete=False)
            audio.export(temp_wav.name, format="wav")
            return temp_wav
        finally:
            # Keep temp files for debugging
            print(f"Temp file created at: {temp_input_path}")
