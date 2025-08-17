# backend/services/llm_service.py
import google.generativeai as genai
from core.config import settings
import json

class LLMService:
    def __init__(self):
        self.model = None

    def configure(self):
        if settings.LLM_PROVIDER == "gemini":
            try:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
                print(f"Gemini model '{settings.GEMINI_MODEL}' configured.")
            except Exception as e:
                print(f"[ERROR] Failed to configure Gemini: {e}")

    async def generate_insights(self, text: str):
        if not self.model: raise RuntimeError("LLM not configured.")
        prompt = f"""Analyze the following text from a user's document. Provide insights grounded *only* in the provided text. Structure your response as a valid JSON object with three keys: "key_takeaways", "contradictions_or_counterpoints", and "related_examples". Each key should have a list of strings as its value. If no insights can be found for a key, return an empty list.

        Text to analyze:
        ---
        {text}
        ---
        """
        try:
            response = await self.model.generate_content_async(prompt)
            cleaned_text = response.text.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_text)
        except Exception as e:
            print(f"[ERROR] Gemini API call failed: {e}")
            return None

llm_service = LLMService()