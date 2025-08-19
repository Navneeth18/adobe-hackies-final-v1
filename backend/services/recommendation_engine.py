# backend/services/recommendation_engine.py
from sentence_transformers import SentenceTransformer, util
import nltk
import re
from collections import defaultdict
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from db.database import mongo_db
import torch
import numpy as np

try:
    nltk.data.path.append('./core_engine_data/nltk_data')
    STOPWORDS = set(stopwords.words("english"))
except Exception: STOPWORDS = set()

class RecommendationService:
    def __init__(self):
        self.model_path = "./core_engine_data/models/all-MiniLM-L6-v2"

        self.model = None
        self.contradiction_keywords = [
            "however", "but", "although", "nevertheless", "nonetheless", "contrary", 
            "conversely", "instead", "differs", "different", "disagree", "dispute", 
            "conflict", "oppose", "contrast", "unlike", "whereas", "while", "yet", 
            "challenge", "contradict", "inconsistent", "discrepancy", "diverge"
        ]
        
        self.viewpoint_keywords = [
            "alternatively", "another perspective", "another approach", "another view", 
            "different approach", "different perspective", "different view", "other approach", 
            "other perspective", "other view", "alternatively", "in contrast", "on the other hand", 
            "some argue", "others suggest", "alternatively", "another possibility"
        ]

    def load_model(self):
        print(f"Loading recommendation model: {self.model_path}")
        try:
            # Try loading local model first
            self.model = SentenceTransformer(self.model_path)
            print("Recommendation model loaded from local path.")
        except Exception as e:
            print(f"Failed to load local model: {e}")
            print("Downloading model from Hugging Face...")
            # Fallback to downloading from Hugging Face
            self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            print("Recommendation model loaded from Hugging Face.")

    def create_embeddings_batch(self, texts: list):
        if not self.model: raise RuntimeError("Model not loaded.")
        return self.model.encode(texts, convert_to_tensor=False, show_progress_bar=False).tolist()

    def create_embeddings(self, texts: list):
        """Create embeddings for a list of texts (single or batch)"""
        if not self.model: raise RuntimeError("Model not loaded.")
        if isinstance(texts, str):
            texts = [texts]
        return self.model.encode(texts, convert_to_tensor=False, show_progress_bar=False).tolist()

    def cosine_similarity(self, embedding1, embedding2):
        """Calculate cosine similarity between two embeddings"""
        if not self.model: raise RuntimeError("Model not loaded.")
        
        # Convert to numpy arrays if they aren't already
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)
        
        # Calculate cosine similarity
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)

    def create_snippet(self, text: str, num_sentences=4):
        if not text or not STOPWORDS: return "Snippet not available."
        try:
            sents = sent_tokenize(text)
            if len(sents) <= num_sentences: return text
            words = word_tokenize(text.lower())
            freq = defaultdict(int); [freq.update({word: freq[word] + 1}) for word in words if word.isalnum() and word not in STOPWORDS]
            if not freq: return " ".join(sents[:num_sentences])
            scores = {sent: sum(freq[word] for word in word_tokenize(sent.lower()) if word in freq) for sent in sents}
            return " ".join([sent for sent, _ in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:num_sentences]])
        except Exception: return text

    async def find_related_sections(self, query_text: str, cluster_id: str, top_k: int = 5):
        if not self.model: raise RuntimeError("Model not loaded.")

        doc_cursor = mongo_db.db["documents"].find({"cluster_id": cluster_id}, {"_id": 1})
        doc_ids = [doc["_id"] async for doc in doc_cursor]
        if not doc_ids: return []

        sections_cursor = mongo_db.db["sections"].find({"document_id": {"$in": doc_ids}})
        all_sections = await sections_cursor.to_list(length=None)
        if not all_sections: return []

        query_embedding = self.model.encode(query_text, convert_to_tensor=True)
        corpus_embeddings = torch.tensor([s['embedding'] for s in all_sections])
        cosine_scores = util.cos_sim(query_embedding, corpus_embeddings)[0]
        top_results = torch.topk(cosine_scores, k=min(top_k, len(all_sections)))

        results = []
        for score, idx in zip(top_results[0], top_results[1]):
            section = all_sections[idx]
            results.append({
                "document_id": section.get("document_id"), "document_name": section.get("source"),
                "page_number": section.get("page"), "section_title": section.get("title"),
                "snippet": self.create_snippet(section.get("content")),
                "relevance_score": round(score.item(), 4)
            })
        return results
        
    def find_contradictions(self, selected_text, section_contents):
        """Find contradictions between selected text and section contents"""
        contradictions = []
        selected_text_lower = selected_text.lower()
        
        for section in section_contents:
            section_lower = section.lower()
            
            # Check for contradiction keywords
            for keyword in self.contradiction_keywords:
                if keyword in section_lower:
                    # Find sentences containing the keyword
                    sentences = self._split_into_sentences(section)
                    for sentence in sentences:
                        if keyword in sentence.lower():
                            contradictions.append({
                                "text": sentence.strip(),
                                "keyword": keyword
                            })
        
        # Remove duplicates and limit to top 5
        unique_contradictions = []
        seen_texts = set()
        
        for contradiction in contradictions:
            if contradiction["text"] not in seen_texts:
                seen_texts.add(contradiction["text"])
                unique_contradictions.append(contradiction)
                if len(unique_contradictions) >= 5:
                    break
                    
        return unique_contradictions
    
    def find_alternate_viewpoints(self, selected_text, section_contents):
        """Find alternate viewpoints between selected text and section contents"""
        viewpoints = []
        selected_text_lower = selected_text.lower()
        
        for section in section_contents:
            section_lower = section.lower()
            
            # Check for viewpoint keywords
            for keyword in self.viewpoint_keywords:
                if keyword in section_lower:
                    # Find sentences containing the keyword
                    sentences = self._split_into_sentences(section)
                    for sentence in sentences:
                        if keyword in sentence.lower():
                            viewpoints.append({
                                "text": sentence.strip(),
                                "keyword": keyword
                            })
        
        # Remove duplicates and limit to top 5
        unique_viewpoints = []
        seen_texts = set()
        
        for viewpoint in viewpoints:
            if viewpoint["text"] not in seen_texts:
                seen_texts.add(viewpoint["text"])
                unique_viewpoints.append(viewpoint)
                if len(unique_viewpoints) >= 5:
                    break
                    
        return unique_viewpoints
        
    def _split_into_sentences(self, text):
        """Split text into sentences"""
        # Simple sentence splitting by punctuation
        sentences = re.split(r'(?<=[.!?]\s)', text)
        return [s.strip() for s in sentences if s.strip()]

recommendation_service = RecommendationService()