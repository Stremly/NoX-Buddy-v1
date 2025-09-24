# nmem_handler.py
import json
import struct
from typing import List, Dict, Any
from datetime import datetime
import os
import paths

class NoxMemoryFile:
    MAGIC = b'NXMM'

    def __init__(self):
        self.filepath = paths.memory_file_path()
        if not os.path.exists(self.filepath):
            self.create_file()

    # ----------------- Create a new nmem file -----------------
    def create_file(self, metadata: Dict[str, Any] = None):
        """Create a new .nmem file with default or provided metadata and empty documents."""
        if os.path.exists(self.filepath):
            raise FileExistsError(f"{self.filepath} already exists.")
        
        if metadata is None:
            metadata = {
                "Version": 1,
                "Last Modified": datetime.now().isoformat(),
                "Document Count": 0,
                "Unique Types": [],
                "Unique SubTypes": [],
                "Unique SubSubTypes": []
            }
        self._write_file(metadata, [])

    # ----------------- Read metadata -----------------
    def read_metadata(self) -> Dict[str, Any]:
        with open(self.filepath, "rb") as f:
            magic = f.read(4)
            if magic != self.MAGIC:
                raise ValueError("Invalid Nox Memory File")
            meta_len = struct.unpack(">I", f.read(4))[0]
            metadata = json.loads(f.read(meta_len))
        return metadata

    # ----------------- Read all documents -----------------
    def read_documents(self) -> List[Dict[str, Any]]:
        documents = []
        with open(self.filepath, "rb") as f:
            magic = f.read(4)
            if magic != self.MAGIC:
                raise ValueError("Invalid Nox Memory File")
            meta_len = struct.unpack(">I", f.read(4))[0]
            f.read(meta_len)  # skip metadata
            while True:
                len_bytes = f.read(4)
                if not len_bytes:
                    break
                doc_len = struct.unpack(">I", len_bytes)[0]
                doc = json.loads(f.read(doc_len))
                documents.append(doc)
        return documents

    # ----------------- Update metadata -----------------
    def update_metadata(self):
        metadata = self.read_metadata()
        metadata['Last Modified'] = datetime.now().isoformat()
        metadata['Document Count'] = len(self.read_documents())
        metadata['Unique Types'] = list(set([doc['Type'] for doc in self.read_documents()]))
        metadata['Unique SubTypes'] = list(set([doc['SubType'] for doc in self.read_documents()]))
        # Correct key is 'SubSubType' in documents; keep metadata key as 'Unique SubSubTypes'
        metadata['Unique SubSubTypes'] = list(set([doc.get('SubSubType') for doc in self.read_documents() if doc.get('SubSubType') is not None]))
        documents = self.read_documents()
        self._write_file(metadata, documents)

    # ----------------- Add a document -----------------
    def add_document(self, document: Dict[str, Any]):
        metadata = self.read_metadata()
        documents = self.read_documents()
        documents.append(document)
        # Update document count in metadata
        metadata["Document Count"] = len(documents)
        self._write_file(metadata, documents)

    # ----------------- Delete a document by _id -----------------
    def delete_document(self, doc_id: str):
        metadata = self.read_metadata()
        documents = self.read_documents()
        documents = [doc for doc in documents if doc.get("_id") != doc_id]
        metadata["Document Count"] = len(documents)
        self._write_file(metadata, documents)

    # ----------------- Internal: write file -----------------
    def _write_file(self, metadata: Dict[str, Any], documents: List[Dict[str, Any]]):
        with open(self.filepath, "wb") as f:
            f.write(self.MAGIC)
            meta_bytes = json.dumps(metadata).encode('utf-8')
            f.write(struct.pack(">I", len(meta_bytes)))
            f.write(meta_bytes)
            for doc in documents:
                doc_bytes = json.dumps(doc).encode('utf-8')
                f.write(struct.pack(">I", len(doc_bytes)))
                f.write(doc_bytes)