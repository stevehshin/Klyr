"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface FilesTileProps {
  tileId: string;
  gridId: string;
  onClose: () => void;
}

interface GridFileMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedByUserId: string | null;
  uploadedBy?: { id: string; email: string } | null;
}

type SortBy = "date" | "name" | "size";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.startsWith("text/")) return "📃";
  return "📎";
}

function canPreviewInBrowser(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/")
  );
}

export function FilesTile({ gridId, onClose }: FilesTileProps) {
  const [files, setFiles] = useState<GridFileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<GridFileMeta | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    if (!gridId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grid/files?gridId=${encodeURIComponent(gridId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load files");
      setFiles(data.files ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [gridId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === "date")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "name") return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    return b.size - a.size;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gridId) return;
    e.target.value = "";
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.set("gridId", gridId);
      formData.set("file", file);
      const res = await fetch("/api/grid/files/upload", {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        if (res.status === 413) data = { error: "File too large. Maximum size is 10MB." };
        else data = { error: text?.slice(0, 100) || "Upload failed." };
      }
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await fetchFiles();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      const res = await fetch(`/api/grid/files/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      if (previewFile?.id === id) setPreviewFile(null);
      await fetchFiles();
    } catch {
      setError("Failed to delete file");
    }
  };

  const downloadUrl = (id: string) => `/api/grid/files/${id}?download=1`;
  const previewUrl = (id: string) => `/api/grid/files/${id}`;

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden bg-transparent">
      <div className="tile-header flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/80 cursor-move bg-gray-50/80 dark:bg-gray-900/80 rounded-t-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📁</span> Files
        </h3>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {uploadError && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
            {uploadError}
          </div>
        )}
        {error && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1"
          >
            <option value="date">Date added</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : sortedFiles.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No files yet. Upload one above.</p>
        ) : (
          <ul className="space-y-1">
            {sortedFiles.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  onClick={() => setPreviewFile(file)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
                >
                  <span className="text-xl flex-shrink-0">{fileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {previewFile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate flex-1 mr-2">
                {previewFile.name}
              </h4>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={downloadUrl(previewFile.id)}
                  download={previewFile.name}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(previewFile.id)}
                  className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-4 bg-gray-100 dark:bg-gray-800">
              {canPreviewInBrowser(previewFile.mimeType) ? (
                previewFile.mimeType.startsWith("image/") ? (
                  <img
                    src={previewUrl(previewFile.id)}
                    alt={previewFile.name}
                    className="max-w-full h-auto max-h-[70vh] object-contain mx-auto"
                  />
                ) : previewFile.mimeType === "application/pdf" ? (
                  <iframe
                    src={previewUrl(previewFile.id)}
                    title={previewFile.name}
                    className="w-full h-[70vh] rounded-lg border-0 bg-white"
                  />
                ) : (
                  <iframe
                    src={previewUrl(previewFile.id)}
                    title={previewFile.name}
                    className="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <span className="text-6xl mb-2">{fileIcon(previewFile.mimeType)}</span>
                  <p className="text-sm">{previewFile.name}</p>
                  <p className="text-xs mt-1">{formatSize(previewFile.size)}</p>
                  <a
                    href={downloadUrl(previewFile.id)}
                    download={previewFile.name}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                  >
                    Download to open
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
