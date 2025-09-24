"""Lightweight RAG helper that queries memory/embedding stores and an LLM.

Provides async helpers to search and construct a small context string from
nearest neighbors, offloading all blocking calls to worker threads.
"""

from dotenv import load_dotenv
import asyncio
from agno.models.google import Gemini
from agno.agent import Agent
from NoX_Agent.schemas import RAGResponse
from utils.nmem_operations import NoxMemoryFile
from utils.nemb_operations import NoxEmbeddingFile
from utils.paths import memory_file_path, embedding_file_path
import os
from env_loader import get_base_path

load_dotenv(get_base_path())

class RAG:
    def __init__(self):
        """Initialize backing LLM agent and local memory/embedding handlers."""
        self.model = Gemini(id="gemini-2.5-flash", api_key=os.getenv("GEMINI_API_KEY"))
        self.agent = Agent(
            name="RAG",
            model=self.model,
            system_message="You are a helpful assistant that can answer questions about the information provided.",
            output_schema=RAGResponse
        )
        self.memory_file = NoxMemoryFile(str(memory_file_path()))
        self.embedding_file = NoxEmbeddingFile(str(embedding_file_path()))

    async def search(self, query: str) -> list[tuple[dict, list[float]]]:
        """Return documents whose ontology matches the LLM-classified query."""
        metadata = await asyncio.to_thread(self.memory_file.read_metadata)

        if metadata['Document Count'] == 0:
            return []

        unique_types = "Unique Types: "+", ".join(metadata["Unique Types"])
        unique_subtypes = "Unique Subtypes: "+", ".join(metadata["Unique SubTypes"])
        unique_subsubtypes = "Unique Subsubtypes: "+", ".join(metadata["Unique SubSubTypes"])
        system_message = f"""
        You are a helpful assistant that can answer questions about the information provided.
        {unique_types}
        {unique_subtypes}
        {unique_subsubtypes}
        """
        self.agent.system_message = system_message

        query = "For the below query, find the most relevant type, subtype and subsubtype from the information provided and return it in the response schema. The query is: {query}"
        response = (await asyncio.to_thread(self.agent.run, query)).content

        documents = await asyncio.to_thread(self.memory_file.read_documents)
        embeddings = await asyncio.to_thread(self.embedding_file.read_embeddings)

        similar_documents = []

        id_to_embedding = {emb.get("_id"): emb for emb in embeddings}

        for document in documents:
            if document["Type"] == response.Type:
                if document["SubType"] == response.SubType:
                    if document["SubSubType"] == response.SubSubType:
                        embedding = id_to_embedding.get(document["id"])
                        similar_documents.append((document["Information"], embedding))
        
        return similar_documents
    
    def get_embedding(self, id):
        embeddings = self.embedding_file.read_embeddings()
        for embedding in embeddings:
            if embedding["_id"] == id:
                return embedding
        return None

    async def k_nearest_neighbors(self, query: str, k: int = 5) -> list[tuple[dict, list[float]]]:
        """Return a simple string with up to k semantically similar documents."""
        metadata = await asyncio.to_thread(self.memory_file.read_metadata)
        if metadata['Document Count'] == 0:
            return ""

        similar_documents = await self.search(query)
        result =  similar_documents[:k]
        result = "\n\n".join([f"Document: {document[0]}" for document in result])
        return result