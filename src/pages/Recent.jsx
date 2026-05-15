import React, { useState, useEffect, useCallback, useMemo } from "react";
import DriveLayout from "../components/DriveLayout";
import FileListRecent from "../components/FileListRecent";
import PreviewModal from "../components/PreviewModal";
import Popup from "../components/Popup.jsx";
import LoadingSpinner from "../components/LoadingSpinner";
import { FiClock, FiFileText, FiRefreshCw } from "react-icons/fi";
import { API_BASE } from "../api/api.js";
import PageHeader from "../components/PageHeader.jsx";

export default function Recent() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const token = localStorage.getItem("api_token");

  const showPopup = useCallback((msg, type = "success") => {
    setPopup({ show: true, message: msg, type });
  }, []);

  /* ---------- Logic: ดึงไฟล์จาก Folder ทั้งหมด (Recursive) ---------- */
  const collectFiles = useCallback((folders) => {
    let temp = [];
    folders.forEach((folder) => {
      if (folder.files_active) {
        temp.push(
          ...folder.files_active.map((f) => ({
            ...f,
            parent_folder: folder.name,
            isFolder: false,
          })),
        );
      }
      if (folder.children_recursive_active?.length) {
        temp.push(...collectFiles(folder.children_recursive_active));
      }
    });
    return temp;
  }, []);

  const fetchRecentFiles = useCallback(async () => {
    if (!token) {
      showPopup("กรุณาเข้าสู่ระบบก่อน", "error");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("ไม่พบข้อมูลผู้ใช้");

      const res = await fetch(`${API_BASE}/Mydrive/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(res.status);

      const data = await res.json();
      const drive = data.data.drive;

      const allFiles = [
        ...(drive.files_active || []).map((f) => ({
          ...f,
          parent_folder: "/",
          isFolder: false,
        })),
        ...collectFiles(drive.folders_active || []),
      ];

      // กรองเฉพาะไฟล์ที่มีการเปิดใช้งาน และเรียงลำดับ
      const sortedFiles = allFiles
        .filter((f) => f.last_opened_at)
        .sort(
          (a, b) => new Date(b.last_opened_at) - new Date(a.last_opened_at),
        );

      setFiles(sortedFiles);
    } catch (err) {
      console.error(err);
      showPopup("โหลดไฟล์ล่าสุดไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [token, collectFiles, showPopup]);

  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles]);

  /* ---------- Handlers ---------- */
  const handlePreview = useCallback((file) => setPreviewFile(file), []);

  const handleFavorite = useCallback(
    async (id, newValue) => {
      const endpoint = newValue ? "favoriteFile" : "RemoveFavoriteFile";
      try {
        const res = await fetch(`${API_BASE}/${endpoint}/${id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error();

        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, favorite: newValue } : f)),
        );
        showPopup(
          newValue ? "เพิ่มในรายการโปรดแล้ว" : "ลบออกจากรายการโปรดแล้ว",
        );
      } catch {
        showPopup("อัปเดตสถานะไม่สำเร็จ", "error");
      }
    },
    [token, showPopup],
  );

  return (
    <DriveLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col min-h-full">
        {/* 1. Page Header */}
        <PageHeader title="ล่าสุด" subtitle="ไฟล์ที่คุณเปิดล่าสุด" />

        {loading && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl px-8 py-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] text-center max-w-xs w-full">
              {/* Spinner */}
              <div className="relative mx-auto mb-5 w-14 h-14">
                <div className="absolute inset-0 rounded-full border-[3px] border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin"></div>
              </div>

              {/* Text */}
              <p className="text-slate-800 font-semibold text-sm">
                กำลังโหลดข้อมูล
              </p>
              <p className="text-xs text-slate-500 mt-1">กรุณารอสักครู่…</p>
            </div>
          </div>
        )}

        {/* 2. Content Area */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100">
              <LoadingSpinner size="large" color="blue" />
              <p className="text-sm text-gray-400 mt-6 animate-pulse font-medium">
                กําลังโหลด...
              </p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm text-center px-6">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <FiFileText size={40} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                ไม่มีประวัติการใช้งาน
              </h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                ไฟล์ที่คุณเปิดหรือแก้ไขล่าสุดจะปรากฏที่นี่
                เพื่อให้คุณกลับมาทำงานต่อได้ทันที
              </p>
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-2 border border-white/60">
              <FileListRecent
                files={files}
                onPreview={handlePreview}
                onFavorite={handleFavorite}
              />
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      <PreviewModal
        show={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <Popup
        show={popup.show}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup((p) => ({ ...p, show: false }))}
        autoClose
        duration={3000}
      />
    </DriveLayout>
  );
}
