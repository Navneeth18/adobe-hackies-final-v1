# backend/services/selected_text_podcast_service.py
"""
Selected Text Podcast Service
Generates podcasts from selected text with current section, relevant sections, and insights
"""

import uuid
import logging
from typing import Dict, List, Optional, Any
from services.tts_service import tts_service
try:
    from services.llm_service import llm_service
except ImportError:
    llm_service = None
try:
    from db.database import get_database
except ImportError:
    get_database = None

logger = logging.getLogger(__name__)

class SelectedTextPodcastService:
    def __init__(self):
        self.db = get_database() if get_database else None
    
    async def generate_podcast_from_selected_text(
        self,
        selected_text: str,
        document_id: Optional[str] = None,
        section_title: Optional[str] = None,
        page_number: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive podcast from selected text including:
        - Current section content
        - Relevant sections from the same document
        - Cross-document insights
        - Contextual analysis
        """
        try:
            logger.info(f"Starting podcast generation for selected text: {selected_text[:100]}...")
            
            # Step 1: Get current section context
            current_section_context = await self._get_current_section_context(
                selected_text, document_id, section_title, page_number
            )
            
            # Step 2: Find relevant sections from the same document
            relevant_sections = await self._find_relevant_sections(
                selected_text, document_id
            )
            
            # Step 3: Get cross-document insights
            cross_document_insights = await self._get_cross_document_insights(
                selected_text
            )
            
            # Step 4: Generate contextual analysis
            contextual_analysis = await self._generate_contextual_analysis(
                selected_text, current_section_context, relevant_sections
            )
            
            # Step 5: Create comprehensive podcast script
            podcast_script = self._create_podcast_script(
                selected_text=selected_text,
                current_section=current_section_context,
                relevant_sections=relevant_sections,
                cross_document_insights=cross_document_insights,
                contextual_analysis=contextual_analysis
            )
            
            # Step 6: Generate audio using TTS service
            audio_filename = await self._generate_audio(podcast_script)
            
            if not audio_filename:
                raise RuntimeError("Failed to generate podcast audio")
            
            # Extract audio_id from filename
            audio_id = audio_filename.replace('.mp3', '')
            
            logger.info(f"Successfully generated podcast: {audio_id}")
            
            return {
                "success": True,
                "audio_id": audio_id,
                "audio_filename": audio_filename,
                "script_preview": podcast_script[:200] + "...",
                "sections_included": len(relevant_sections),
                "insights_count": len(cross_document_insights)
            }
            
        except Exception as e:
            logger.error(f"Error generating podcast from selected text: {e}")
            return {
                "success": False,
                "error": str(e),
                "audio_id": None
            }
    
    async def _get_current_section_context(
        self,
        selected_text: str,
        document_id: Optional[str],
        section_title: Optional[str],
        page_number: Optional[int]
    ) -> Dict[str, Any]:
        """Get context about the current section where text was selected"""
        try:
            if not document_id or not self.db:
                return {"title": "Selected Text", "content": selected_text, "page": page_number}
            
            # Query database for section information
            collection = self.db.get_collection("document_sections")
            
            # Try to find the exact section
            section_query = {"document_id": document_id}
            if section_title:
                section_query["title"] = {"$regex": section_title, "$options": "i"}
            elif page_number:
                section_query["page_number"] = page_number
            
            section = collection.find_one(section_query)
            
            if section:
                return {
                    "title": section.get("title", "Current Section"),
                    "content": section.get("content", selected_text),
                    "page": section.get("page_number", page_number),
                    "document_name": section.get("document_name", "Document")
                }
            else:
                # Fallback: create context from selected text
                return {
                    "title": section_title or "Selected Section",
                    "content": selected_text,
                    "page": page_number,
                    "document_name": "Current Document"
                }
                
        except Exception as e:
            logger.warning(f"Could not get section context: {e}")
            return {"title": "Selected Text", "content": selected_text, "page": page_number}
    
    async def _find_relevant_sections(
        self,
        selected_text: str,
        document_id: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Find relevant sections from the same document"""
        try:
            if not document_id:
                return []
            
            # Use semantic search to find related sections
            try:
                from services.graph_service import graph_service
                
                # Search for semantically similar content in the same document
                search_results = await graph_service.semantic_search(
                    query_text=selected_text,
                    document_ids=[document_id],
                    limit=3
                )
                
                relevant_sections = []
                for result in search_results.get("snippets", []):
                    if result.get("document_id") == document_id:
                        relevant_sections.append({
                            "title": result.get("section_title", "Related Section"),
                            "content": result.get("text", ""),
                            "page": result.get("page_number"),
                            "similarity_score": result.get("similarity_score", 0)
                        })
                
                return relevant_sections[:3]  # Limit to top 3 relevant sections
            except ImportError:
                logger.warning("Graph service not available, using fallback")
                return []
            
        except Exception as e:
            logger.warning(f"Could not find relevant sections: {e}")
            return []
    
    async def _get_cross_document_insights(
        self,
        selected_text: str
    ) -> List[Dict[str, Any]]:
        """Get insights from across all documents"""
        try:
            try:
                from services.graph_service import graph_service
                
                # Search across all documents for related content
                search_results = await graph_service.semantic_search(
                    query_text=selected_text,
                    limit=5
                )
                
                insights = []
                for result in search_results.get("snippets", []):
                    insights.append({
                        "content": result.get("text", ""),
                        "document_name": result.get("document_name", "Unknown Document"),
                        "section_title": result.get("section_title", ""),
                        "connection_type": "semantic_similarity",
                        "similarity_score": result.get("similarity_score", 0)
                    })
                
                return insights[:3]  # Limit to top 3 cross-document insights
            except ImportError:
                logger.warning("Graph service not available for cross-document insights")
                return []
            
        except Exception as e:
            logger.warning(f"Could not get cross-document insights: {e}")
            return []
    
    async def _generate_contextual_analysis(
        self,
        selected_text: str,
        current_section: Dict[str, Any],
        relevant_sections: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate contextual analysis using LLM"""
        try:
            if not llm_service:
                logger.warning("LLM service not available, using fallback analysis")
                return {
                    "key_themes": ["Analysis of selected text"],
                    "connections": ["Related to document content"],
                    "implications": ["Relevant for understanding the topic"],
                    "questions": ["What are the broader implications?"]
                }
            
            # Prepare context for LLM analysis
            context = f"""
            Selected Text: {selected_text}
            
            Current Section: {current_section.get('title', 'Unknown')}
            Section Content: {current_section.get('content', '')[:500]}...
            
            Related Sections:
            """
            
            for i, section in enumerate(relevant_sections, 1):
                context += f"\n{i}. {section.get('title', 'Section')} - {section.get('content', '')[:200]}..."
            
            # Generate insights using LLM service
            analysis_prompt = f"""
            Analyze the following selected text and its context. Provide:
            1. Key themes and concepts
            2. Connections between the selected text and related sections
            3. Potential implications or applications
            4. Questions this text raises
            
            Context:
            {context}
            
            Provide a structured analysis that would be suitable for a podcast discussion.
            """
            
            try:
                analysis = await llm_service.generate_insights(analysis_prompt)
                
                return {
                    "key_themes": analysis.get("key_themes", ["Analysis of selected text"]),
                    "connections": analysis.get("connections", ["Related to document content"]),
                    "implications": analysis.get("implications", ["Relevant for understanding the topic"]),
                    "questions": analysis.get("questions", ["What are the broader implications?"])
                }
            except Exception as llm_error:
                logger.warning(f"LLM service error: {llm_error}")
                return {
                    "key_themes": ["Analysis of selected text"],
                    "connections": ["Related to document content"],
                    "implications": ["Relevant for understanding the topic"],
                    "questions": ["What are the broader implications?"]
                }
            
        except Exception as e:
            logger.warning(f"Could not generate contextual analysis: {e}")
            return {
                "key_themes": ["Analysis of selected text"],
                "connections": ["Related to document content"],
                "implications": ["Relevant for understanding the topic"],
                "questions": ["What are the broader implications?"]
            }
    
    def _create_podcast_script(
        self,
        selected_text: str,
        current_section: Dict[str, Any],
        relevant_sections: List[Dict[str, Any]],
        cross_document_insights: List[Dict[str, Any]],
        contextual_analysis: Dict[str, Any]
    ) -> str:
        """Create a comprehensive podcast script"""
        
        script_parts = []
        
        # Introduction
        script_parts.append(
            "Welcome to your personalized document insights podcast. "
            "Today we're diving deep into a selected passage and exploring its connections "
            "across your document collection."
        )
        
        # Main selected text
        script_parts.append(
            f"Let's start with the text you selected: {selected_text}"
        )
        
        # Current section context
        if current_section.get("title") != "Selected Text":
            script_parts.append(
                f"This text comes from the section titled '{current_section.get('title', 'Current Section')}' "
                f"on page {current_section.get('page', 'unknown')} of {current_section.get('document_name', 'the document')}."
            )
            
            if current_section.get("content") and current_section["content"] != selected_text:
                script_parts.append(
                    f"For additional context, this section discusses: {current_section['content'][:300]}..."
                )
        
        # Relevant sections from the same document
        if relevant_sections:
            script_parts.append(
                "Now, let's explore how this connects to other parts of the same document."
            )
            
            for i, section in enumerate(relevant_sections, 1):
                script_parts.append(
                    f"Related section {i}: '{section.get('title', 'Section')}' mentions: "
                    f"{section.get('content', '')[:200]}... "
                    f"This appears on page {section.get('page', 'unknown')}."
                )
        
        # Cross-document insights
        if cross_document_insights:
            script_parts.append(
                "Interestingly, I found connections to this topic in other documents as well."
            )
            
            for i, insight in enumerate(cross_document_insights, 1):
                script_parts.append(
                    f"In {insight.get('document_name', 'another document')}, "
                    f"the section '{insight.get('section_title', 'a related section')}' states: "
                    f"{insight.get('content', '')[:200]}..."
                )
        
        # Contextual analysis
        if contextual_analysis.get("key_themes"):
            script_parts.append(
                "Based on my analysis, the key themes emerging from this text include: " +
                ", ".join(contextual_analysis["key_themes"][:3])
            )
        
        if contextual_analysis.get("implications"):
            script_parts.append(
                "The implications of this content suggest: " +
                ". ".join(contextual_analysis["implications"][:2])
            )
        
        if contextual_analysis.get("questions"):
            script_parts.append(
                "This raises some interesting questions: " +
                " ".join(contextual_analysis["questions"][:2])
            )
        
        # Conclusion
        script_parts.append(
            "That concludes our deep dive into your selected text and its connections "
            "across your document collection. Thank you for listening to your personalized insights podcast!"
        )
        
        return " ".join(script_parts)
    
    async def _generate_audio(self, script: str) -> Optional[str]:
        """Generate audio from the podcast script"""
        try:
            # Configure TTS service if not already configured
            if not tts_service.speech_config:
                tts_service.configure()
            
            # Generate audio using the existing TTS service
            # We'll use a simplified version that doesn't require all the parameters
            audio_id = str(uuid.uuid4())
            filename = f"{audio_id}.mp3"
            
            # Create SSML for the podcast
            ssml_string = f"""
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                <voice name="en-US-JennyNeural">
                    <prosody rate="medium" pitch="medium">
                        {script}
                    </prosody>
                </voice>
            </speak>
            """
            
            # Use Azure TTS to generate audio
            import azure.cognitiveservices.speech as speechsdk
            
            audio_config = speechsdk.audio.AudioOutputConfig(filename=filename)
            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=tts_service.speech_config, 
                audio_config=audio_config
            )
            
            result = synthesizer.speak_ssml_async(ssml_string).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                logger.info(f"Successfully generated audio file: {filename}")
                return filename
            else:
                logger.error(f"TTS synthesis failed: {result.cancellation_details}")
                return None
                
        except Exception as e:
            logger.error(f"Error generating audio: {e}")
            return None

# Global instance
selected_text_podcast_service = SelectedTextPodcastService()
