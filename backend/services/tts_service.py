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
                self.speech_config = speechsdk.SpeechConfig(subscription=settings.AZURE_TTS_KEY, region=settings.AZURE_TTS_REGION)
                print("Azure TTS Service configured.")
            except Exception as e:
                print(f"[ERROR] Failed to configure Azure TTS: {e}")

    async def generate_podcast_audio(self, selected_text, snippets=None, contradictions=None, alternate_viewpoints=None):
        """Generate a podcast-style audio file from selected text and insights"""
        if not self.speech_config: raise RuntimeError("TTS Service not configured.")
        
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
                contradictions_content += f"{contradiction['text']}. "
            contradictions_content += "\n"
        
        # Alternative viewpoints
        viewpoints_content = ""
        if alternate_viewpoints and len(alternate_viewpoints) > 0:
            viewpoints_content = "Here are some alternative perspectives: "
            for i, viewpoint in enumerate(alternate_viewpoints[:2]):
                viewpoints_content += f"{viewpoint['text']}. "
            viewpoints_content += "\n"
        
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
            
            <voice name="en-US-JennyNeural">
                <prosody rate="medium">{conclusion}</prosody>
            </voice>
        </speak>
        """
        
        audio_config = speechsdk.audio.AudioOutputConfig(filename=filename)
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config, audio_config=audio_config)
        result = synthesizer.speak_ssml_async(ssml_string).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return filename
        else:
            cancellation = result.cancellation_details
            print(f"Speech synthesis canceled: {cancellation.reason}, Details: {cancellation.error_details}")
            return None

tts_service = TTSService()