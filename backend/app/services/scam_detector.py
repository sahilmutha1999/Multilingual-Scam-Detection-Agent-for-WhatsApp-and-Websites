import google.generativeai as genai
from dotenv import load_dotenv
import os
from ..models.schemas import RiskLevel, Language

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

SCAM_DETECTION_PROMPT = """
Analyze the following message for potential scam indicators. Consider the following aspects:
1. Urgency or pressure tactics
2. Requests for personal information
3. Financial requests or offers
4. Suspicious links or attachments
5. Unusual sender behavior
6. Language patterns typical of scams

Message: {message}

Provide your analysis in the following format:
Risk Level: [SAFE/SUSPICIOUS/SCAM]
Confidence: [0-1]
Explanation: [Detailed explanation of why this message is considered safe/suspicious/scam]

Focus on identifying:
- Phishing attempts
- Financial scams
- Identity theft attempts
- Social engineering tactics
- Suspicious investment opportunities
- Fake emergency situations
"""

def detect_scam(text: str, language: Language = Language.ENGLISH) -> dict:
    try:
        # Prepare the prompt with the message
        prompt = SCAM_DETECTION_PROMPT.format(message=text)
        
        # Generate response from Gemini
        response = model.generate_content(prompt)
        
        # Get the raw response text
        raw_text = response.text.strip()
        
        # Parse the response
        lines = raw_text.split('\n')
        risk_level = RiskLevel.SAFE
        confidence = 0.0
        explanation = ""
        
        # Find the indices where each section starts
        risk_level_idx = -1
        confidence_idx = -1
        explanation_idx = -1
        
        for i, line in enumerate(lines):
            if line.startswith("Risk Level:"):
                risk_level_idx = i
            elif line.startswith("Confidence:"):
                confidence_idx = i
            elif line.startswith("Explanation:"):
                explanation_idx = i
        
        # Extract risk level
        if risk_level_idx >= 0:
            risk_level_text = lines[risk_level_idx].split(":")[1].strip().lower()
            if "scam" in risk_level_text:
                risk_level = RiskLevel.SCAM
            elif "suspicious" in risk_level_text:
                risk_level = RiskLevel.SUSPICIOUS
            else:
                risk_level = RiskLevel.SAFE
        
        # Extract confidence
        if confidence_idx >= 0:
            try:
                confidence = float(lines[confidence_idx].split(":")[1].strip())
            except ValueError:
                confidence = 0.5  # Default if parsing fails
        
        # Extract full explanation (all lines after "Explanation:" until the end)
        if explanation_idx >= 0:
            explanation_parts = []
            explanation_header = lines[explanation_idx].split(":", 1)
            if len(explanation_header) > 1:
                explanation_parts.append(explanation_header[1].strip())
            
            # Add all remaining lines as part of the explanation
            for i in range(explanation_idx + 1, len(lines)):
                explanation_parts.append(lines[i])
            
            explanation = " ".join(explanation_parts)
        
        # If no explanation was found, create a basic one
        if not explanation:
            explanation = f"Content was analyzed and found to be {risk_level.value}"
        
        # Debug print to check the full explanation
        print(f"Full explanation: {explanation}")
        
        return {
            "risk_level": risk_level,
            "confidence": confidence,
            "explanation": explanation,
            "language": language
        }
    
    except Exception as e:
        # Print the full error for debugging
        import traceback
        print(f"Scam detection error: {str(e)}")
        print(traceback.format_exc())
        
        # Always provide a valid language in case of error
        if language is None:
            language = Language.ENGLISH
            
        raise Exception(f"Error in scam detection: {str(e)}")

def detect_language(text: str) -> Language:
    try:
        # Simple language detection based on common words
        text = text.lower()
        
        # English indicators
        english_words = {"the", "be", "to", "of", "and", "a", "in", "that", "have", "i"}
        # Spanish indicators
        spanish_words = {"el", "la", "los", "las", "que", "y", "en", "un", "una", "es"}
        # French indicators
        french_words = {"le", "la", "les", "un", "une", "et", "en", "que", "est", "je"}
        
        # Count matches for each language
        english_count = sum(1 for word in english_words if word in text)
        spanish_count = sum(1 for word in spanish_words if word in text)
        french_count = sum(1 for word in french_words if word in text)
        
        # Return the language with the most matches
        counts = {
            Language.ENGLISH: english_count,
            Language.SPANISH: spanish_count,
            Language.FRENCH: french_count
        }
        
        return max(counts.items(), key=lambda x: x[1])[0]
    
    except Exception as e:
        # Default to English if detection fails
        return Language.ENGLISH 