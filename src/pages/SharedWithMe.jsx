import React, { useRef, useState } from "react";


const API_BASE = "https://free-easter-tropical.ngrok-free.dev/api/v1";
// หรือ local
// const API_BASE = "http://192.168.1.200/project-googledrive/public/api/v1";

export default function UploadActions({
  currentFolder,
  currentPath = [],
  hasPermission,
  showNotification,
  loadSharedWithMe,
  findFolderRecursive,
  convertToDisplayItems,
  updateState,
  state,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  if (!currentFolder || !currentFolder.allow_edit) return null;

  // =========================
  // Upload Files (Chunked)
  // =========================
  const handleUploadFiles = async (files) => {
    if (!files || !files.length) return;

    if (!hasPermission("edit")) {
      showNotification("error", "คุณไม่มีสิทธิ์อัปโหลดไฟล์");
      return;
    }

    const token = localStorage.getItem("api_token");
    if (!token) {
      showNotification("error", "Token ไม่ถูกต้อง");
      return;
    }

    const currentPos =
      currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
    const currentFolderId = currentPos?.id || currentFolder.id;

    setUploading(true);
    updateState({ uploading: true });

    const CHUNK_SIZE = 1024 * 1024 * 2; // 2MB
    let successCount = 0;

    for (const file of files) {
      try {
        // 1️⃣ START
        const startFd = new FormData();
        startFd.append("original_name", file.name);
        startFd.append("total_size", file.size);
        startFd.append("folder_id", currentFolderId);

        const startRes = await fetch(`${API_BASE}/upload/start`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: startFd,
        });

        const startData = await startRes.json();
        if (!startData.upload_id)
          throw new Error(startData.message || "เริ่มอัปโหลดไม่สำเร็จ");

        const uploadId = startData.upload_id;

        // 2️⃣ CHUNKS
        let offset = 0;
        while (offset < file.size) {
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const currentOffset = offset;

          offset = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_BASE}/upload/chunk`);
            xhr.setRequestHeader(
              "Authorization",
              `Bearer ${token}`
            );

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const res = JSON.parse(xhr.responseText);
                resolve(res.uploaded_size);
              } else {
                reject("อัปโหลด chunk ล้มเหลว");
              }
            };

            xhr.onerror = () => reject("Network error");

            const fd = new FormData();
            fd.append("upload_id", uploadId);
            fd.append("chunk", chunk);
            fd.append("offset", currentOffset);

            xhr.send(fd);
          });
        }

        // 3️⃣ FINISH
        const finishRes = await fetch(`${API_BASE}/upload/finish`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ upload_id: uploadId }),
        });

        const finishData = await finishRes.json();
        if (!finishData.success)
          throw new Error(finishData.message || "จบการอัปโหลดไม่สำเร็จ");

        successCount++;
      } catch (err) {
        showNotification("error", `${file.name}: ${err.message}`);
      }
    }

    // 4️⃣ REFRESH
    if (successCount > 0) {
      showNotification("success", `อัปโหลดสำเร็จ ${successCount} ไฟล์`);
      const fresh = await loadSharedWithMe();

      if (fresh && currentFolderId) {
        const { processedData, ownersMap } = fresh;
        const updatedFolder = findFolderRecursive(
          processedData,
          currentFolderId
        );

        if (updatedFolder) {
          const displayItems = convertToDisplayItems(
            updatedFolder.children || [],
            ownersMap,
            updatedFolder
          );

          updateState({
            currentItems: displayItems,
            currentFolderPermission: updatedFolder,
            uploading: false,
          });
        }
      }
    }

    setUploading(false);
    updateState({ uploading: false });
  };

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          📂 <span className="font-semibold">{currentFolder.name}</span>
          <span className="ml-2 rounded-full border border-green-500 px-2 py-0.5 text-xs text-green-600">
            แก้ไขได้
          </span>
        </div>

        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? "กำลังอัปโหลด..." : "☁️ อัปโหลดไฟล์"}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files)}
      />
    </div>
  );
}
