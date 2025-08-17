# backend/services/graph_service.py
from sklearn.feature_extraction.text import TfidfVectorizer
from db.database import mongo_db
import nltk

try:
    nltk.data.path.append('./core_engine_data/nltk_data')
    STOPWORDS = nltk.corpus.stopwords.words('english')
except:
    STOPWORDS = []

class GraphService:
    def _extract_key_concepts(self, all_content: list, top_n=50):
        """Extracts top entities/concepts using TF-IDF."""
        if not all_content: return []
        vectorizer = TfidfVectorizer(max_features=top_n, stop_words=STOPWORDS, ngram_range=(1, 3))
        vectorizer.fit_transform(all_content)
        return vectorizer.get_feature_names_out()

    async def build_knowledge_graph(self, cluster_id: str):
        """Builds and returns a knowledge graph for a given cluster."""
        doc_cursor = mongo_db.db["documents"].find({"cluster_id": cluster_id}, {"_id": 1})
        doc_ids = [doc["_id"] async for doc in doc_cursor]
        if not doc_ids: return {"nodes": [], "links": []}

        sections_cursor = mongo_db.db["sections"].find({"document_id": {"$in": doc_ids}})
        all_sections = await sections_cursor.to_list(length=None)
        if not all_sections: return {"nodes": [], "links": []}

        all_content = [f"{s['title']} {s['content']}" for s in all_sections]
        key_concepts = self._extract_key_concepts(all_content)

        nodes = [{"id": concept, "group": 1} for concept in key_concepts]
        links = []

        # Create links between concepts if they appear in the same section
        for section_content in all_content:
            present_concepts = [c for c in key_concepts if c in section_content]
            for i in range(len(present_concepts)):
                for j in range(i + 1, len(present_concepts)):
                    link = {"source": present_concepts[i], "target": present_concepts[j], "value": 1}
                    if link not in links:
                        links.append(link)

        return {"nodes": nodes, "links": links}

graph_service = GraphService()