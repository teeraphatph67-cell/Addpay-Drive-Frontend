import React, { useRef, useState } from "react";
import { API_BASE } from "../../api/api";

const UploadActions = ({ currentFolder, onRefresh }) => {
  const fileInputRef = useRef(null);

  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  // ===== Create folder modal =====
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  // ❌ ไม่มีโฟลเดอร์ หรือไม่มีสิทธิ์แก้ไข
  if (!currentFolder || !currentFolder.allow_edit) return null;

  // ===============================
  // CREATE FOLDER
  // ===============================
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      setCreating(true);
      const token = localStorage.getItem("api_token");

      const res = await fetch(`${API_BASE}/AddFolder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: folderName.trim(),
          parent_id: Number(currentFolder.id),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "create folder failed");
      }

      setShowCreateFolder(false);
      setFolderName("");
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("❌ สร้างโฟลเดอร์ไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  };

  // ===============================
  // UPLOAD FILES (CHUNK)
  // ===============================
  const handleUploadFiles = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem("api_token");
    if (!token) {
      alert("❌ กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์");
      return;
    }

    const CHUNK_SIZE = 1024 * 1024 * 2; // 2MB
    setIsUploading(true);

    for (const file of files) {
      try {
        // ===== 1️⃣ START =====
        const startFd = new FormData();
        startFd.append("original_name", file.name);
        startFd.append("total_size", file.size);
        startFd.append("folder_id", currentFolder.id);

        const startRes = await fetch(`${API_BASE}/upload/start`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: startFd,
        });

        const startData = await startRes.json();
        if (!startRes.ok || !startData.upload_id) {
          throw new Error(startData.message || "start upload failed");
        }

        const uploadId = startData.upload_id;
        let offset = 0;

        // ===== 2️⃣ UPLOAD CHUNKS =====
        while (offset < file.size) {
          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          const currentOffset = offset;

          offset = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.open("POST", `${API_BASE}/upload/chunk`);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            xhr.upload.onprogress = (e) => {
              if (!e.lengthComputable) return;

              const uploaded = currentOffset + e.loaded;
              const percent = Math.min(
                100,
                Math.round((uploaded / file.size) * 100)
              );

              setUploadProgress((p) => ({
                ...p,
                [file.name]: { percent },
              }));
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const res = JSON.parse(xhr.responseText);
                  resolve(res.uploaded_size);
                } catch {
                  reject("invalid response");
                }
              } else {
                reject(xhr.responseText);
              }
            };

            xhr.onerror = () => reject("network error");

            const fd = new FormData();
            fd.append("upload_id", uploadId);
            fd.append("chunk", chunk);
            fd.append("offset", currentOffset);

            xhr.send(fd);
          });
        }

        // ===== 3️⃣ FINISH =====
        const finishFd = new FormData();
        finishFd.append("upload_id", uploadId);

        const finishRes = await fetch(`${API_BASE}/upload/finish`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: finishFd,
        });

        if (!finishRes.ok) {
          throw new Error("finish upload failed");
        }

      } catch (err) {
        console.error(err);
        alert(`❌ อัปโหลด ${file.name} ไม่สำเร็จ`);
      }
    }

    setIsUploading(false);
    setUploadProgress({});
    e.target.value = "";
    onRefresh?.();
  };

  return (
    <>
      {/* ================= ACTION BAR ================= */}
      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-blue-700">
          📂 <strong>{currentFolder.name}</strong>
          <span className="rounded-full border border-green-600 bg-white px-2 py-0.5 text-xs text-green-600">
            แก้ไขได้
          </span>
        </div>

        {/* Upload progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-3 space-y-2 rounded-lg border bg-white p-3">
            {Object.entries(uploadProgress).map(([name, p]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-xs text-gray-600">
                  <span className="truncate">{name}</span>
                  <span>{p.percent}%</span>
                </div>
                <div className="h-2 w-full rounded bg-gray-200">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateFolder(true)}
            disabled={isUploading}
            className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50"
          >
            ➕ สร้างโฟลเดอร์
          </button>

          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? "⏳ กำลังอัปโหลด..." : "☁️ อัปโหลดไฟล์"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleUploadFiles}
        />
      </div>

      {/* ================= CREATE FOLDER MODAL ================= */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-semibold text-gray-800">
              สร้างโฟลเดอร์ใหม่
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              ภายใน <strong>{currentFolder.name}</strong>
            </p>

            <input
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="ชื่อโฟลเดอร์"
              className="mb-4 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setFolderName("");
                }}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleCreateFolder}
                disabled={creating || !folderName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "กำลังสร้าง..." : "สร้าง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadActions;
