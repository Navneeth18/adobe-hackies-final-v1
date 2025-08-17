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

    async def generate_insights(self, text: str, related_snippets: list = None):
        if not self.model: raise RuntimeError("LLM not configured.")
        
        # Build context from related snippets if available
        context_section = ""
        if related_snippets and len(related_snippets) > 0:
            context_section = "\n\nRelated content from user's document library:\n"
            for i, snippet in enumerate(related_snippets[:5]):  # Limit to top 5 snippets
                context_section += f"\n[Document: {snippet.get('section_title', 'Unknown')}]\n{snippet.get('text', '')}"
        
        prompt = f"""You are analyzing text from a user's personal document library. Your goal is to provide valuable insights that go beyond simple text similarity. Focus on:

1. **Contradictory Viewpoints**: Identify any conflicting perspectives, opposing arguments, or contradictory statements within the selected text or between the selected text and related content.

2. **Alternate Uses/Applications**: Highlight different ways the concepts, methods, or ideas could be applied or interpreted.

3. **Contextual Enrichment**: Provide insights that deepen understanding by connecting ideas, revealing patterns, or highlighting nuances.

**CRITICAL**: Base your analysis ONLY on the provided text and related content from the user's documents. Do NOT use external knowledge or web sources.

Selected text to analyze:
---
{text}
---{context_section}

Provide your response as a valid JSON object with these keys:
- "contradictory_viewpoints": List of conflicting perspectives or opposing arguments found
- "alternate_applications": List of different ways the concepts could be used or interpreted  
- "contextual_insights": List of deeper insights that enrich understanding
- "cross_document_connections": List of connections or patterns across different documents (if applicable)

If no insights can be found for a key, return an empty list."""
        try:
            response = await self.model.generate_content_async(prompt)
            cleaned_text = response.text.strip().replace("```json", "").replace("```", "").strip()
            insights = json.loads(cleaned_text)
            
            # Ensure all expected keys exist
            expected_keys = ["contradictory_viewpoints", "alternate_applications", "contextual_insights", "cross_document_connections"]
            for key in expected_keys:
                if key not in insights:
                    insights[key] = []
                    
            return insights
        except Exception as e:
            print(f"[ERROR] Gemini API call failed: {e}")
            return None

llm_service = LLMService()