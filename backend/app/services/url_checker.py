from pysafebrowsing import SafeBrowsing
from dotenv import load_dotenv
import os
from ..models.schemas import RiskLevel, Language

load_dotenv()

class URLChecker:
    def __init__(self):
        self.client = SafeBrowsing(key=os.getenv("GOOGLE_API_KEY"))

    def check_url(self, url: str) -> dict:
        try:
            # Check the URL using the Safe Browsing API
            response = self.client.lookup_urls([url])
            
            if not response or url not in response or not response[url].get('malicious', False):
                return {
                    "risk_level": RiskLevel.SAFE,
                    "confidence": 1.0,
                    "explanation": "URL is safe according to Google Safe Browsing",
                    "language": Language.ENGLISH
                }

            # Get threat details
            url_info = response[url]
            threats = url_info.get('threats', [])
            platforms = url_info.get('platforms', [])
            
            # Determine risk level
            if 'MALWARE' in threats or 'SOCIAL_ENGINEERING' in threats:
                risk_level = RiskLevel.SCAM
            else:
                risk_level = RiskLevel.SUSPICIOUS

            # Generate explanation
            threat_types = ', '.join(threats)
            platform_types = ', '.join(platforms)
            explanation = f"URL flagged as {threat_types} on {platform_types} platforms"

            return {
                "risk_level": risk_level,
                "confidence": 0.9,
                "explanation": explanation,
                "language": Language.ENGLISH
            }

        except Exception as e:
            return {
                "risk_level": RiskLevel.SUSPICIOUS,
                "confidence": 0.5,
                "explanation": f"Error checking URL: {str(e)}",
                "language": Language.ENGLISH
            } 