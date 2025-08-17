# backend/services/tts_service.py
import azure.cognitiveservices.speech as speechsdk
from core.config import settings
import uuid

class TTSService:
    def __init__(self):
        self.speech_config = None

    def configure(self):
        if settings.TTS_PROVIDER == "azure":
            try:
                if not settings.AZURE_TTS_KEY or not settings.AZURE_TTS_REGION:
                    print(f"[ERROR] Missing Azure TTS credentials: KEY={bool(settings.AZURE_TTS_KEY)}, REGION={bool(settings.AZURE_TTS_REGION)}")
                    return
                
                self.speech_config = speechsdk.SpeechConfig(subscription=settings.AZURE_TTS_KEY, region=settings.AZURE_TTS_REGION)
                self.speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"
                print(f"[SUCCESS] Azure TTS Service configured with region: {settings.AZURE_TTS_REGION}")
            except Exception as e:
                print(f"[ERROR] Failed to configure Azure TTS: {e}")
                import traceback
                traceback.print_exc()

    async def generate_podcast_audio(self, selected_text, snippets=None, contradictions=None, alternate_viewpoints=None, contextual_insights=None, cross_document_connections=None):
        """Generate a podcast-style audio file from selected text and insights"""
        if not self.speech_config: 
            raise RuntimeError("TTS Service not configured. Please check Azure credentials.")
        
        # Generate a unique filename
        audio_id = str(uuid.uuid4())
        filename = f"{audio_id}.mp3"
        
        # Prepare the podcast script
        intro = f"Welcome to your personalized document insights podcast. Today we're exploring a selected topic from your documents."
        
        # Main content from selected text
        main_content = f"Here's the main point you selected: {selected_text}"
        
        # Related snippets
        related_content = ""
        if snippets and len(snippets) > 0:
            related_content = "Here are some related points from your documents: "
            for i, snippet in enumerate(snippets[:3]):
                related_content += f"Point {i+1}: {snippet['text']}. "
                if 'document_name' in snippet:
                    related_content += f"This comes from {snippet['document_name']}. "
                related_content += "\n"
        
        # Contradictions
        contradictions_content = ""
        if contradictions and len(contradictions) > 0:
            contradictions_content = "I've found some contradictory viewpoints: "
            for i, contradiction in enumerate(contradictions[:2]):
                if isinstance(contradiction, str):
                    contradictions_content += f"{contradiction}. "
                else:
                    contradictions_content += f"{contradiction.get('text', str(contradiction))}. "
            contradictions_content += "\n"
        
        # Alternative viewpoints/applications
        viewpoints_content = ""
        if alternate_viewpoints and len(alternate_viewpoints) > 0:
            viewpoints_content = "Here are some alternative applications: "
            for i, viewpoint in enumerate(alternate_viewpoints[:2]):
                if isinstance(viewpoint, str):
                    viewpoints_content += f"{viewpoint}. "
                else:
                    viewpoints_content += f"{viewpoint.get('text', str(viewpoint))}. "
            viewpoints_content += "\n"
        
        # Contextual insights
        contextual_content = ""
        if contextual_insights and len(contextual_insights) > 0:
            contextual_content = "Here are some deeper contextual insights: "
            for i, insight in enumerate(contextual_insights[:2]):
                if isinstance(insight, str):
                    contextual_content += f"{insight}. "
                else:
                    contextual_content += f"{insight.get('text', str(insight))}. "
            contextual_content += "\n"
        
        # Cross-document connections
        connections_content = ""
        if cross_document_connections and len(cross_document_connections) > 0:
            connections_content = "I've found connections across your documents: "
            for i, connection in enumerate(cross_document_connections[:2]):
                if isinstance(connection, str):
                    connections_content += f"{connection}. "
                else:
                    connections_content += f"{connection.get('text', str(connection))}. "
            connections_content += "\n"
        
        # Conclusion
        conclusion = "That concludes your personalized document insights podcast. Thank you for listening!"
        
        # Create SSML for multiple speakers with pauses between sections
        ssml_string = f"""
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
            <voice name="en-US-JennyNeural">
                <prosody rate="medium">{intro}</prosody>
            </voice>
            <break time="1s"/>
            
            <voice name="en-US-DavisNeural">
                <prosody rate="medium">{main_content}</prosody>
            </voice>
            <break time="1s"/>
            
            <voice name="en-US-JennyNeural">
                <prosody rate="medium">{related_content}</prosody>
            </voice>
            <break time="1s"/>
            
            <voice name="en-US-GuyNeural">
                <prosody rate="medium">{contradictions_content}</prosody>
            </voice>
            <break time="1s"/>
            
            <voice name="en-US-AriaNeural">
                <prosody rate="medium">{viewpoints_content}</prosody>
            </voice>
            <break time="1s"/>
            
            <voice name="en-US-DavisNeural">
                <prosody rate="medium">{contextual_content}</prosody>
            </voice>
            <break time="1s"/>
            
            <voice name="en-US-GuyNeural">
                <prosody rate="medium">{connections_content}</prosody>
            </voice>
            <break time="1s"/>
            
            <voice name="en-US-JennyNeural">
                <prosody rate="medium">{conclusion}</prosody>
            </voice>
        </speak>
        """
        
        try:
            print(f"[INFO] Starting audio synthesis for file: {filename}")
            print(f"[INFO] SSML content length: {len(ssml_string)} characters")
            
            audio_config = speechsdk.audio.AudioOutputConfig(filename=filename)
            synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config, audio_config=audio_config)
            
            print("[INFO] Calling Azure TTS API...")
            result = synthesizer.speak_ssml_async(ssml_string).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                print(f"[SUCCESS] Audio file generated: {filename}")
                import os
                if os.path.exists(filename):
                    file_size = os.path.getsize(filename)
                    print(f"[INFO] Generated file size: {file_size} bytes")
                return filename
            else:
                cancellation = result.cancellation_details
                error_msg = f"Speech synthesis canceled: {cancellation.reason}"
                if cancellation.error_details:
                    error_msg += f", Details: {cancellation.error_details}"
                print(f"[ERROR] {error_msg}")
                raise RuntimeError(error_msg)
        except Exception as e:
            print(f"[ERROR] TTS generation failed: {e}")
            import traceback
            traceback.print_exc()
            raise RuntimeError(f"Failed to generate audio: {str(e)}")

tts_service = TTSService()