"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icons";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function readableSize(bytes) {
  if (!bytes) return "0 KB";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadModal({ open, onClose, onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!open) return null;

  const chooseFile = (candidate) => {
    setError("");
    if (!candidate) return;
    if (candidate.type !== "application/pdf" && !/\.pdf$/i.test(candidate.name)) {
      setError("Please choose a PDF document.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError("The PDF must be smaller than 50 MB.");
      return;
    }
    setFile(candidate);
  };

  const close = () => {
    if (uploading) return;
    setFile(null);
    setError("");
    setProgress(0);
    onClose();
  };

  const submit = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      await onUpload(file, setProgress);
      setFile(null);
      setProgress(0);
      onClose();
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-layer" role="presentation" onMouseDown={close}>
      <section
        aria-labelledby="upload-title"
        aria-modal="true"
        className="upload-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">Judgment library</span>
            <h2 id="upload-title">Upload a judgment</h2>
            <p>Add a searchable court judgment to this workspace.</p>
          </div>
          <button aria-label="Close upload dialog" className="icon-button" onClick={close}>
            <Icon name="close" />
          </button>
        </div>

        <input
          accept="application/pdf,.pdf"
          className="visually-hidden"
          onChange={(event) => chooseFile(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />

        <button
          className={`drop-zone ${dragging ? "is-dragging" : ""}`}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            chooseFile(event.dataTransfer.files?.[0]);
          }}
          type="button"
        >
          <span className="drop-icon"><Icon name="upload" size={25} /></span>
          <strong>Drop your PDF here</strong>
          <span>or click to browse · maximum 50 MB</span>
        </button>

        {file && (
          <div className="chosen-file">
            <span className="file-icon"><Icon name="file" /></span>
            <div className="chosen-file-copy">
              <strong>{file.name}</strong>
              <span>{readableSize(file.size)}</span>
              {uploading && (
                <div className="upload-progress" aria-label={`Upload ${progress}% complete`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
            {!uploading && (
              <button aria-label="Remove selected file" className="icon-button subtle" onClick={() => setFile(null)}>
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        )}

        {error && <div className="upload-error" role="alert">{error}</div>}

        <div className="modal-actions">
          <button className="btn btn-light" disabled={uploading} onClick={close}>Cancel</button>
          <button className="btn btn-primary upload-submit" disabled={!file || uploading} onClick={submit}>
            {uploading ? `Processing ${progress}%` : "Add to library"}
          </button>
        </div>
      </section>
    </div>
  );
}
