"""Memory Manager: classifies and stores user memories with embeddings.

Async entrypoint `store_information` offloads blocking model, file IO,
and embedding operations to worker threads for event loop safety.
"""

from datetime import datetime
import asyncio
from agno.agent import Agent
from Memory_Manager.schemas import Memories
from utils.nmem_operations import NoxMemoryFile
from utils.nemb_operations import NoxEmbeddingFile
from agno.models.google import Gemini
from utils.paths import memory_file_path, embedding_file_path, models_dir
import os
import uuid
from sentence_transformers import SentenceTransformer
from env_loader import get_base_path
from dotenv import load_dotenv

load_dotenv(get_base_path())

MODEL_NAME = "all-MiniLM-L6-v2"

class MemoryManager:
    def __init__(self):
        """Initialize LLM agent, memory and embedding stores, and encoder."""
        self.llm = Gemini(id="gemini-2.0-flash-001", api_key=os.getenv("GEMINI_API_KEY"))
        self.agent = Agent(
            name="Memory Manager",
            model=self.llm,
            description="A agent that manages the memory of the user.",
            instructions=[
                "You are a memory manager. Infer an ontology for each piece of information.",
                "For every input information, decide a Type, SubType, and SubSubType that best describe it.",
                "Only reuse existing categories if they truly fit; otherwise, create new, sensible ones.",
                "Prefer clear human-meaningful labels. Example: user name → Type=Personal Info, SubType=User, SubSubType=Name.",
                "Return a structured list matching the response schema exactly."
            ],
            output_schema=Memories,
            structured_outputs=True,
            use_json_mode=True,
        )
        self.memory_file = NoxMemoryFile(str(memory_file_path()))
        self.embedding_file = NoxEmbeddingFile(str(embedding_file_path()))

        self.model = self.get_model()
        
        # Ensure memory file exists and is initialized
        if not os.path.exists(self.memory_file.filepath):
            self.memory_file.create_file()
    
    def get_model(self) -> SentenceTransformer:
        local_model_path = models_dir() / MODEL_NAME

        if local_model_path.exists():
            model = SentenceTransformer(str(local_model_path))
        else:
            model = SentenceTransformer(MODEL_NAME)
            # Save downloaded model locally
            model.save(str(local_model_path))
        return model

    async def store_information(self, informations: list[str]):
        """Classify input strings and persist structured memories and embeddings."""
        if len(informations) == 0:
            return
        metadata = await asyncio.to_thread(self.memory_file.read_metadata)
        unqiue_types = ", ".join(metadata.get('Unique Types', []))
        unqiue_subtypes = ", ".join(metadata.get('Unique SubTypes', []))
        unqiue_subsubtypes = ", ".join(metadata.get('Unique SubSubTypes', []))
        
        informations_string = ""
        for information in informations:
            informations_string += f"{information}\n"
        
        model_input = (
            "You are classifying and storing user memories.\n"
            f"Information items (one per line):\n{informations_string}\n\n"
            "Your task: For each item, infer a concise Type, SubType, and SubSubType that best describe it.\n"
            "Guidelines:\n"
            "- Prefer human-meaningful, specific labels.\n"
            "- Reuse existing categories only if they clearly fit; otherwise create new ones.\n"
            f"- Existing Types: {unqiue_types or 'None'}\n"
            f"- Existing SubTypes: {unqiue_subtypes or 'None'}\n"
            f"- Existing SubSubTypes: {unqiue_subsubtypes or 'None'}\n"
            "Output strictly as the response schema (Memories) with one memory per input."
        )

        response = (await asyncio.to_thread(self.agent.run, model_input)).content

        for memory in response.memories:
            memory_id = str(uuid.uuid4())
            document = {
                "Date": datetime.now().isoformat(),
                "Type": memory.Type,
                "id": memory_id,
                "SubType": memory.SubType,
                "SubSubType": memory.SubSubType,
                "Information": memory.Information
            }
            await asyncio.to_thread(self.memory_file.add_document, document)

            embedding = (await asyncio.to_thread(self.model.encode, memory.Information)).tolist()
            await asyncio.to_thread(self.embedding_file.add_embedding, {
                "_id": memory_id,
                "text_embedding": embedding
            })

        await asyncio.to_thread(self.memory_file.update_metadata)