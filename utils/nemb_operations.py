# nemb_handler.py

import json
import struct
from typing import List, Dict, Any
import os
import paths


class NoxEmbeddingFile:
    MAGIC = b'NXEB'

    def __init__(self):
        self.filepath = paths.embedding_file_path()
        if not os.path.exists(self.filepath):
            self.create_file()

    # ----------------- Create a new nemb file -----------------
    def create_file(self):
        """Create an empty .nemb file."""
        if os.path.exists(self.filepath):
            raise FileExistsError(f"{self.filepath} already exists.")
        with open(self.filepath, "wb") as f:
            f.write(self.MAGIC)

    # ----------------- Read all embeddings -----------------
    def read_embeddings(self) -> List[Dict[str, Any]]:
        embeddings = []
        with open(self.filepath, "rb") as f:
            magic = f.read(4)
            if magic != self.MAGIC:
                raise ValueError("Invalid Nox Embedding File")

            while True:
                len_bytes = f.read(4)
                if not len_bytes:
                    break
                emb_len = struct.unpack(">I", len_bytes)[0]
                emb = json.loads(f.read(emb_len))
                embeddings.append(emb)
        return embeddings

    # ----------------- Add an embedding -----------------
    def add_embedding(self, embedding: Dict[str, Any]):
        """
        embedding example:
        {
            "_id": "emb123",
            "text_embedding": [0.12, 0.55, 0.91, ...],   # required
            "image_embedding": [0.11, 0.22, 0.33, ...]   # optional
        }
        """
        if "text_embedding" not in embedding:
            raise ValueError("Each embedding must include a text_embedding field.")

        with open(self.filepath, "ab") as f:
            emb_bytes = json.dumps(embedding).encode("utf-8")
            f.write(struct.pack(">I", len(emb_bytes)))
            f.write(emb_bytes)

    # ----------------- Delete an embedding by _id -----------------
    def delete_embedding(self, emb_id: str):
        embeddings = self.read_embeddings()
        embeddings = [emb for emb in embeddings if emb.get("_id") != emb_id]
        self._rewrite(embeddings)

    # ----------------- Internal: rewrite whole file -----------------
    def _rewrite(self, embeddings: List[Dict[str, Any]]):
        with open(self.filepath, "wb") as f:
            f.write(self.MAGIC)
            for emb in embeddings:
                emb_bytes = json.dumps(emb).encode("utf-8")
                f.write(struct.pack(">I", len(emb_bytes)))
                f.write(emb_bytes)