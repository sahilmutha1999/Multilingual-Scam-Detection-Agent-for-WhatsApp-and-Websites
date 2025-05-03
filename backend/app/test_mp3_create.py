from gtts import gTTS

# Scam-like message
scam_text = "Congratulations! You’ve won a $1000 gift card. Just provide your bank details now to claim your reward. Act fast, this offer is limited!"

# Generate TTS
tts = gTTS(scam_text, lang='en', slow=False)
tts.save("scam_sample.mp3")

print("✅ Scam-like audio saved as 'scam_sample.mp3'")
