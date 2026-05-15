import React, { useEffect, useState, useMemo } from "react";
import { FiImage, FiX } from "react-icons/fi";

const SharePreviewModal = ({ show, file, onClose }) => {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  const [textContent, setTextContent] = useState("");
  const [error, setError] = useState(false);

  // ===== data mapping (เหมือนเดิม) =====
  const fileItem = file;
  const fileData = file?.data ?? file;
  const token = localStorage.getItem("api_token");

  const formatThaiDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString)
      .toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", " เวลา");
  };

  /* =========================
     FILE TYPE DETECT
  ========================= */
  const { isImage, isPdf, isVideo, isAudio, isText } = useMemo(() => {
    const mime = fileData?.mime_type || "";
    const ext = fileData?.extension || fileData?.file_ext || "";

    return {
      isImage: mime.startsWith("image/"),
      isPdf: mime.includes("pdf"),
      isVideo: mime.startsWith("video/"),
      isAudio: mime.startsWith("audio/"),
      isText:
        mime.startsWith("text/") ||
        ["txt", "log", "md", "json", "csv", "xml"].includes(ext),
    };
  }, [fileData]);

  /* =========================
     DOWNLOAD (เหมือนเดิม)
  ========================= */
  const handleDownloadPreview = async () => {
    try {
      const permission =
        fileItem?.permission ||
        fileItem?.resource_permission ||
        fileItem?.shared_permission ||
        null;

      const permissionId =
        permission?.id ||
        fileItem?.resource_permission_id ||
        fileItem?.shared_permission_id;

      const fileId = fileData?.id;

      if (!permissionId || !fileId) {
        alert("ไม่มีข้อมูลในการดาวน์โหลด");
        return;
      }

      const scope = permission?.scope || "private";
      const isPublic = scope === "public";

      const downloadUrl = isPublic
        ? `/mydrive/service-api/mydrive/public/api/v1/public/shared/file/${permissionId}/download?file_id=${fileId}`
        : `/mydrive/service-api/mydrive/public/api/v1/shared/file/${permissionId}/download?file_id=${fileId}`;

      const headers = {};
      if (!isPublic && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(downloadUrl, { headers });
      if (!res.ok) throw new Error("download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileData.original_name || fileData.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("ดาวน์โหลดไม่สำเร็จ");
    }
  };

  /* =========================
     PREVIEW LOAD
  ========================= */
  useEffect(() => {
    if (!show || !fileData?.preview_url) return;

    let objectUrl;
    setError(false);
    setTextContent("");

    const loadPreview = async () => {
      try {
        setLoading(true);

        const res = await fetch(fileData.preview_url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("โหลดไฟล์ไม่ได้");

        if (isText) {
          const text = await res.text();
          if (text.length > 1_000_000) {
            setTextContent("ไฟล์มีขนาดใหญ่เกินไป กรุณาดาวน์โหลดเพื่อเปิด");
          } else {
            setTextContent(text);
          }
        } else {
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      } catch (err) {
        console.error("Preview error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [show, fileData, isText]);

  if (!show || !fileData) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <FiImage className="text-blue-500" size={28} />
            <div>
              <div className="font-semibold">{fileData.name}</div>
              <div className="text-xs text-gray-500">
                {fileData.mime_type}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <FiX />
            </button>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="bg-gray-100 flex items-center justify-center min-h-[65vh] p-6 overflow-auto">
          {loading && <span>กำลังโหลด...</span>}

          {!loading && error && (
            <span className="text-red-500">
              ไม่สามารถแสดงตัวอย่างไฟล์ได้
            </span>
          )}

          {/* IMAGE */}
          {!loading && isImage && src && (
            <img
              src={src}
              alt={fileData.name}
              className="max-h-[80vh] max-w-full object-contain"
            />
          )}

          {/* PDF */}
          {!loading && isPdf && src && (
            <iframe
              src={src}
              className="w-full h-[80vh] bg-white rounded"
              title="pdf-preview"
            />
          )}

          {/* VIDEO */}
          {!loading && isVideo && src && (
            <video
              src={src}
              controls
              className="max-h-[80vh] max-w-full"
            />
          )}

          {/* AUDIO */}
          {!loading && isAudio && src && (
            <audio src={src} controls className="w-full" />
          )}

          {/* TEXT (⭐ FIX อยู่ตรงนี้) */}
          {!loading && isText && (
            <div className="w-full h-full max-h-[65vh] bg-white rounded overflow-hidden">
              <pre
                className="
        w-full
        h-full
        p-4
        text-sm
        whitespace-pre-wrap
        break-words
        overflow-auto
      "
              >
                {textContent}
              </pre>
            </div>
          )}

        </div>

        {/* ===== FOOTER ===== */}
        <div className="flex justify-between px-4 py-2 text-sm border-t bg-white">
          <span className="text-green-600">พร้อมใช้งาน</span>
          <span>ประเภทไฟล์: {fileData.mime_type || "-"}</span>
          <span>อัปเดตล่าสุด: {formatThaiDateTime(fileData.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default SharePreviewModal;
