"""
ARIA — Optimized RAG Engine
Handles document ingestion, vector storage, and retrieval-augmented generation.
"""

import os
from pathlib import Path
from typing import List, Optional
import PyPDF2
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from datetime import datetime

# ── Configuration ─────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
DB_DIR = ROOT / "data" / "vector_store"
DB_DIR.mkdir(parents=True, exist_ok=True)

# Lazy Embeddings (Local, zero cost)
_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        print("📥 Initializing AI Embeddings (all-MiniLM-L6-v2)...")
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings

class RAGEngine:
    def __init__(self):
        self.vector_store: Optional[FAISS] = None
        self._initialized = False

    def _ensure_initialized(self):
        """Lazy load the store and embeddings only when needed."""
        if not self._initialized:
            self.load_store()
            self._initialized = True

    def load_store(self):
        """Load FAISS index from disk if it exists."""
        if (DB_DIR / "index.faiss").exists():
            try:
                self.vector_store = FAISS.load_local(
                    str(DB_DIR), 
                    get_embeddings(), 
                    allow_dangerous_deserialization=True
                )
                print("✅ Vector store loaded from disk.")
            except Exception as e:
                print(f"⚠️ Error loading vector store: {e}")
                self.vector_store = None

    def save_store(self):
        """Save current FAISS index to disk."""
        if self.vector_store:
            self.vector_store.save_local(str(DB_DIR))

    def process_document(self, file_path: str, file_name: str) -> str:
        """Read PDF/Text, split, and add to vector store."""
        self._ensure_initialized()
        content = ""
        if file_path.endswith(".pdf"):
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    content += page.extract_text() + "\n"
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

        if not content.strip():
            return "Empty document."

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=80)
        chunks = splitter.split_text(content)
        
        docs = [Document(page_content=c, metadata={"source": file_name}) for c in chunks]

        # Add to FAISS
        if self.vector_store:
            self.vector_store.add_documents(docs)
        else:
            self.vector_store = FAISS.from_documents(docs, get_embeddings())
        
        self.save_store()
        return f"Successfully indexed {len(chunks)} chunks from {file_name}."

    def query(self, text: str, k: int = 4) -> str:
        """Retrieve relevant context for a query."""
        self._ensure_initialized()
        if not self.vector_store:
            return ""
        
        results = self.vector_store.similarity_search(text, k=k)
        context = "\n---\n".join([r.page_content for r in results])
        return context

    def store_interaction(self, user_id: str, message: str, response: str):
        """Store a chat interaction as a memory document for future retrieval."""
        self._ensure_initialized()
        
        # 1. Check for memory bloat (limit memory documents)
        if self.vector_store:
            # This is a very rough check since we don't track types in the index easily
            # However, for this implementation, we'll just guard against excessive growth
            if self.vector_store.index.ntotal > 500: # doc chunks + memory
                 print(f"⚠️ Vector store reached limit ({self.vector_store.index.ntotal}). Skipping interaction storage.")
                 return

        content = f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\nUser: {message}\nAssistant: {response}"
        doc = Document(page_content=content, metadata={"source": f"chat_memory_{user_id}", "type": "memory"})
        
        if self.vector_store:
            self.vector_store.add_documents([doc])
        else:
            self.vector_store = FAISS.from_documents([doc], get_embeddings())
        
        self.save_store()
        print(f"🧠 Memory stored for user {user_id}")

# Singleton instance
engine = RAGEngine()
