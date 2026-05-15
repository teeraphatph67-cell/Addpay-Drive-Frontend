import { useState } from "react";
import { API_BASE } from "../../api/api";

const useFileDownloader = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  /* ===============================
   * Utils
   * =============================== */
  const saveBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const getDownloadPermissionId = (item) => {
    if (!item) return null;

    return (
      item.resource_permission_id ||
      item.source_permission_id ||
      item.permission_id ||
      item.permission?.id ||
      null
    );
  };

  /* ===============================
   * Main
   * =============================== */
  const downloadSharedFiles = async (selectedItems) => {
    if (!selectedItems?.length) return;

    const token = localStorage.getItem("api_token");
    if (!token) {
      alert("Session expired. กรุณา Login ใหม่");
      return;
    }

    setIsDownloading(true);

    try {
      /* ===============================
       * ✅ โหลดไฟล์เดียว (ตรง ๆ ไม่ zip)
       * =============================== */
      if (selectedItems.length === 1 && selectedItems[0].type === "file") {
        const item = selectedItems[0];
        const permissionId = getDownloadPermissionId(item);
        const fileId = item.file_id || item.id;

        if (!permissionId || !fileId) {
          throw new Error("Missing permission_id หรือ file_id");
        }

        const res = await fetch(
          `${API_BASE}/shared/file/${permissionId}/download?file_id=${fileId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/octet-stream",
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Server error ${res.status}`);
        }

        const blob = await res.blob();
        saveBlob(blob, item.file_name || item.name || "downloaded_file");
        return;
      }

      /* ===============================
       * ✅ โหลดหลายไฟล์ / โฟลเดอร์ (ZIP)
       * =============================== */
      const zipItems = selectedItems
        .map((i) => {
          const permissionId = getDownloadPermissionId(i);
          if (!permissionId || !i.type) return null;

          // 📄 FILE → ต้องใช้ file_id จริง
          if (i.type === "file") {
            const fileId = i.file_id || i.id;
            if (!fileId) return null;

            return {
              permission_id: permissionId,
              target_type: "file",
              target_id: fileId,
            };
          }

          // 📁 FOLDER → ใช้ folder_id / id
          if (i.type === "folder") {
            const folderId = i.folder_id || i.id;
            if (!folderId) return null;

            return {
              permission_id: permissionId,
              target_type: "folder",
              target_id: folderId,
            };
          }

          return null;
        })
        .filter(Boolean);

      if (!zipItems.length) {
        throw new Error("ไม่มีรายการที่สามารถดาวน์โหลดได้");
      }

      console.log("📦 ZIP payload:", zipItems);

      const res = await fetch(`${API_BASE}/shared/download-multiple`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: zipItems }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "การสร้างไฟล์ ZIP ล้มเหลว");
      }

      const blob = await res.blob();
      saveBlob(blob, "shared_items.zip");
    } catch (err) {
      console.error("❌ Download Error:", err);
      alert(`ดาวน์โหลดไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadSharedFiles, isDownloading };
};

export default useFileDownloader;
