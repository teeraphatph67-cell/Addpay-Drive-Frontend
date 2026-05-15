import React, { useState, useEffect, useMemo } from "react";
import { BASE_URL, API_BASE } from "../../api/api.js";

/* ================= Loading Spinner ================= */
const LoadingSpinner = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 z-10">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
    <span className="text-xs text-gray-500">กำลังโหลดตัวอย่าง...</span>
  </div>
);

/* ================= Helper ================= */
const buildFileUrl = (path) => {
  if (!path) return null;
  const cleanBase = BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
};

/* ================= Main Component ================= */
const FilePreviewModal = ({ file, onClose }) => {
  const [error, setError] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  /* ---------- File URL ---------- */
  const fileUrl = useMemo(
    () => buildFileUrl(file?.file_path),
    [file]
  );

  /* ---------- Reset state when file changes ---------- */
  useEffect(() => {
    setError(false);
    setTextContent("");
    setIsLoading(true);
  }, [file]);

  /* ---------- ESC close ---------- */
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  /* ---------- File type detect ---------- */
  const { isImage, isVideo, isPdf, isText } = useMemo(() => {
    const ext = file?.file_ext?.toLowerCase() || "";
    const mime = file?.mime_type || "";

    return {
      isImage: ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext),
      isVideo: mime.startsWith("video/") || ["mp4", "mov", "webm"].includes(ext),
      isPdf: mime === "application/pdf" || ext === "pdf",
      isText:
        mime.startsWith("text/") ||
        ["txt", "log", "md", "json", "csv", "xml"].includes(ext),
    };
  }, [file]);

  /* ================= Download ================= */
  const handleDownloadSingle = async () => {
    if (!file) return;

    try {
      setIsDownloading(true);

      const token = localStorage.getItem("api_token");
      if (!token) {
        alert("Session expired. กรุณา Login ใหม่");
        return;
      }

      const pId =
        file?.resource_permission_id ||
        file?.source_permission_id ||
        file?.permission_id ||
        file?.id;

      if (!pId) throw new Error("ไม่พบ file id");

      const cleanBase = (API_BASE || BASE_URL).replace(/\/+$/, "");
      const downloadUrl = `${cleanBase}/shared/file/${pId}/download`;

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        file.file_name || file.name || `file.${file.file_ext || "dat"}`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("ไม่สามารถดาวน์โหลดไฟล์ได้");
    } finally {
      setIsDownloading(false);
    }
  };

  /* ---------- Load Text File ---------- */
  useEffect(() => {
    if (!isText || !fileUrl) return;

    const controller = new AbortController();
    setIsLoading(true);

    fetch(fileUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("โหลดไฟล์ไม่ได้");
        return res.text();
      })
      .then((text) => {
        if (text.length > 1_000_000) {
          setTextContent("ไฟล์มีขนาดใหญ่เกินไป กรุณาดาวน์โหลดเพื่อเปิด");
        } else {
          setTextContent(text);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(true);
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [isText, fileUrl]);

  const handleMediaLoad = () => setIsLoading(false);
  const handleMediaError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Header ================= */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="truncate">
            <h3 className="font-semibold truncate">
              {file.file_name || file.name}
            </h3>
            <div className="text-xs text-gray-500 mt-1">
              {file.file_ext}
            </div>
          </div>

          <div className="flex gap-2">
            {/* <button
              onClick={handleDownloadSingle}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-60"
            >
              {isDownloading ? "กำลังโหลด..." : "ดาวน์โหลด"}
            </button> */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= Body ================= */}
        <div className="flex-1 min-h-0 relative bg-gray-50 flex items-center justify-center overflow-auto">
          {isLoading && !error && <LoadingSpinner />}

          {isImage && fileUrl && !error && (
            <img
              src={fileUrl}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              className="max-h-full max-w-full w-auto h-auto object-contain"
              alt=""
            />
          )}

          {isVideo && fileUrl && (
            <video
              src={fileUrl}
              controls
              onLoadedData={handleMediaLoad}
              onError={handleMediaError}
              className="max-h-full max-w-full"
            />
          )}

          {isPdf && fileUrl && (
            <iframe
              src={fileUrl}
              onLoad={handleMediaLoad}
              onError={handleMediaError}
              className="w-full h-full bg-white"
              title="PDF"
            />
          )}

          {isText && !error && (
            <div className="w-full h-full bg-white p-4 overflow-auto">
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <pre className="text-sm whitespace-pre-wrap">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-500 flex flex-col items-center">
              <div className="text-5xl mb-2">⚠️</div>
              โหลดไฟล์ไม่สำเร็จ
            </div>
          )}
        </div>

        {/* ================= Footer ================= */}
        <div className="px-6 py-3 border-t text-xs text-gray-500">
          สร้างเมื่อ:{" "}
          {file.created_at
            ? new Date(file.created_at).toLocaleString("th-TH")
            : "-"}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
