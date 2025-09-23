import React, { useRef, useState, useEffect } from "react";
import { renderAsync } from "docx-preview";

export default function DialogInput({ onSend }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
    };
  }, [attachments]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileSelect = (e) => {
    const list = e.target.files;
    if (!list) return;
    addFiles(Array.from(list));
    e.target.value = null;
  };

  const isSupported = (file) => {
    const allowed = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (file.type.startsWith("image/")) return true;
    return allowed.some((t) => file.type === t || file.type.startsWith(t));
  };

  const addFiles = (fileArray) => {
    const newItems = fileArray
      .filter(isSupported)
      .map((file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        return { id, file, preview };
      });
    setAttachments((prev) => [...prev, ...newItems]);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found && found.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    const files = attachments.map((a) => a.file);
    onSend && onSend({ text: text.trim(), files });
    attachments.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
    setText("");
    setAttachments([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) addFiles(dropped);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

const openFile = (file, preview) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const newWindow = window.open("", "_blank");

    if (!newWindow) return;

    newWindow.document.title = file.name;

    //Case 1: PDF
    if (ext === "pdf") {
      const url = URL.createObjectURL(file);
      newWindow.document.write(`
        <html><head><title>${file.name}</title></head>
        <body style="margin:0">
          <iframe src="${url}" style="width:100%;height:100%;border:none"></iframe>
        </body></html>
      `);
      newWindow.document.close();
      return;
    }

    //Case 2: Images
    if (file.type.startsWith("image/")) {
      newWindow.document.write(`
        <html><head><title>${file.name}</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center">
          <img src="${preview}" style="max-width:100%;max-height:100%;" />
        </body></html>
      `);
      newWindow.document.close();
      return;
    }

    //Case 3: DOCX
if (ext === "docx") {
  newWindow.document.write(`
    <html><head><title>${file.name}</title></head>
    <body><div id="docx-container"></div></body></html>
  `);
  newWindow.document.close();

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const arrayBuffer = e.target.result;
      const container = newWindow.document.getElementById("docx-container"); // ✅ defined here
      await renderAsync(arrayBuffer, container);
    } catch (err) {
      const container = newWindow.document.getElementById("docx-container");
      if (container) {
        container.innerHTML = `<p style="color:red">Failed to render DOCX</p>`;
      }
    }
  };
  reader.readAsArrayBuffer(file);
  return;
}


    //Case 4: Unknown file 
    const url = URL.createObjectURL(file);
    newWindow.location.href = url;
  };



  const renderAttachment = (a) => {
    const name = a.file.name;
    const size = formatBytes(a.file.size);
    return (
      <div key={a.id} className="flex flex-col items-center w-24">
        <div
          className="relative w-20 h-20 rounded-md overflow-hidden border bg-gray-50 cursor-pointer flex items-center justify-center"
          onClick={() => openFile(a.file, a.preview)}
        >
          {a.preview ? (
            <img src={a.preview} alt={name} className="object-cover w-full h-full" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h6l4 4v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 1 1 2-2z" />
            </svg>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeAttachment(a.id); }}
            className="absolute top-0 right-0 mt-1 mr-1 p-0.5 rounded-full bg-white hover:bg-gray-100 shadow"
            aria-label={`Remove ${a.file.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.28 5.22a.75.75 0 011.06 0L10 7.94l2.66-2.72a.75.75 0 111.06 1.06L11.06 9l2.72 2.66a.75.75 0 11-1.06 1.06L10 10.06l-2.66 2.72a.75.75 0 11-1.06-1.06L8.94 9 6.22 6.34a.75.75 0 010-1.12z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="w-20 truncate text-xs mt-1 text-center" title={name}>{name}</div>
        <div className="text-[10px] text-gray-500">{size}</div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div
        className={`rounded-lg border ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200"} p-3`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
              className="w-full min-h-[56px] max-h-40 resize-none rounded-md px-3 py-2 text-sm border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />

            {attachments.length > 0 && (
              <div className="mt-3 flex flex-row flex-wrap gap-3">
                {attachments.map((a) => renderAttachment(a))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={openFilePicker}
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />
                  </svg>
                  Attach
                </button>
                <div className="text-xs text-gray-500">You can attach images, PDFs, docs. Drag & drop supported.</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setText(""); attachments.forEach((a) => a.preview && URL.revokeObjectURL(a.preview)); setAttachments([]); }}
                  type="button"
                  className="text-sm px-3 py-1.5 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={handleSend}
                  type="button"
                  disabled={!text.trim() && attachments.length === 0}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${text.trim() || attachments.length ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        />
      </div>
      {isDragging && (
        <div className="mt-2 text-sm text-blue-600">Drop files here to attach</div>
      )}
    </div>
  );
}