import React, { useEffect, useState, useCallback } from "react";
import DriveLayout from "../components/DriveLayout";
import FileList from "../components/FileList";
import Popup from "../components/Popup.jsx";
import PreviewModal from "../components/PreviewModal.jsx";
import { API_BASE } from "../api/api.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import {
  FiTrash2,
  FiRotateCcw,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader.jsx";

export default function Trash() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
    onConfirm: null,
  });

  const token = localStorage.getItem("api_token");

  /* ================= Helpers ================= */
  const showPopup = useCallback(
    (message, type = "success", onConfirm = null) =>
      setPopup({ show: true, message, type, onConfirm }),
    [],
  );

  const flattenTrash = useCallback((folders) => {
    let result = [];
    folders.forEach((f) => {
      result.push(f);
      if (f.trashed_children_recursive?.length) {
        result = result.concat(flattenTrash(f.trashed_children_recursive));
      }
    });
    return result;
  }, []);

  /* ================= Fetch & Navigation ================= */
  const fetchTrash = useCallback(
    async (folderId = null) => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) return;

        const res = await fetch(`${API_BASE}/Trash/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) return;

        const drive = data.data.drive;
        const allFolders = flattenTrash(drive.trashed_folders || []).map(
          (f) => ({
            ...f,
            isFolder: true,
          }),
        );

        const currentFolders = allFolders.filter(
          (f) => f.parent_id === folderId,
        );
        const currentFiles = (drive.trashed_files || [])
          .filter((f) =>
            folderId
              ? f.folder_id === folderId
              : !allFolders.some((x) => x.id === f.folder_id),
          )
          .map((f) => ({
            ...f,
            isFolder: false,
            file_url: f.file_path
              ? `${API_BASE.replace("/api/v1", "")}/${f.file_path.replace(/^\/+/, "")}`
              : f.url_file || null,
          }));

        setFolders(currentFolders);
        setFiles(currentFiles);
        setCurrentFolder(folderId);
        setSelectedIds([]);
      } catch (err) {
        showPopup("❌ โหลดข้อมูลถังขยะล้มเหลว", "error");
      } finally {
        setLoading(false);
      }
    },
    [token, flattenTrash, showPopup],
  );

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  // ✅ เพิ่ม goToFolder เพื่อแก้ปัญหา ReferenceError
  const goToFolder = useCallback(
    (id) => {
      fetchTrash(id);
    },
    [fetchTrash],
  );

  /* ================= Actions ================= */
  const handleRestore = async (item) => {
    const url = item.isFolder
      ? `${API_BASE}/restore-folder/${item.id}`
      : `${API_BASE}/restore-file/${item.id}`;

    await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTrash(currentFolder);
    showPopup("♻️ กู้คืนสำเร็จ!");
  };

  const handleRestoreSelected = () => {
    if (!selectedIds.length) return;
    const allItems = [...folders, ...files].filter((i) =>
      selectedIds.includes(i.id),
    );

    showPopup(
      `กู้คืน ${allItems.length} รายการที่เลือก?`,
      "warning",
      async () => {
        for (const item of allItems) {
          const url = item.isFolder
            ? `${API_BASE}/restore-folder/${item.id}`
            : `${API_BASE}/restore-file/${item.id}`;
          await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        fetchTrash(currentFolder);
        showPopup("♻️ กู้คืนรายการที่เลือกสำเร็จ!");
      },
    );
  };

  const handleDeleteForever = (items) => {
    const itemsArray = Array.isArray(items) ? items : [items];

    const file_ids = itemsArray.filter((i) => !i.isFolder).map((i) => i.id);

    const folder_ids = itemsArray.filter((i) => i.isFolder).map((i) => i.id);

    if (!file_ids.length && !folder_ids.length) return;

    showPopup(
      `ลบ ${itemsArray.length} รายการถาวร? (ไม่สามารถกู้คืนได้)`,
      "error",
      async () => {
        try {
          const res = await fetch(`${API_BASE}/trashbulk`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              file_ids,
              folder_ids,
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error(text);
            throw new Error();
          }

          fetchTrash(currentFolder);
          setSelectedIds([]);
          showPopup("🗑 ลบถาวรเรียบร้อยแล้ว", "success");
        } catch {
          showPopup("❌ ลบถาวรไม่สำเร็จ", "error");
        }
      },
    );
  };

  const handleEmptyTrash = () => {
    showPopup("ล้างถังขยะทั้งหมดถาวรใช่ไหม?", "error", async () => {
      const res = await fetch(`${API_BASE}/emptyTrash`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        showPopup("❌ ล้างถังขยะไม่สำเร็จ", "error");
        return;
      }

      fetchTrash();
      showPopup("🗑 ล้างถังขยะเรียบร้อย!");
    });
  };

  return (
    <DriveLayout>
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

      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <PageHeader
            title="ถังขยะ"
            subtitle="รายการในถังขยะอาจถูกลบถาวรโดยระบบหลังจากผ่านไป 30 วัน"
          />

          <div className="flex items-center gap-3">
            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <button
                  onClick={handleRestoreSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all border border-emerald-200"
                >
                  <FiRotateCcw size={16} /> กู้คืนที่เลือก
                </button>
                <button
                  onClick={() =>
                    handleDeleteForever(
                      [...folders, ...files].filter((i) =>
                        selectedIds.includes(i.id),
                      ),
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-all "
                >
                  ลบถาวร
                </button>
              </div>
            ) : (
              (folders.length > 0 || files.length > 0) && (
                <button
                  onClick={handleEmptyTrash}
                  className="flex items-center gap-2 px-4 py-2 text-rose-600  rounded-xl text-sm font-bold transition-all border border-transparent "
                >
                  ล้างถังขยะ
                </button>
              )
            )}
          </div>
        </div>

        {/* Content */}
        <div className="">
          {loading ? (
            <div className=" "></div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl  text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <FiTrash2 size={36} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                ถังขยะว่างเปล่า
              </h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                ไม่มีไฟล์หรือโฟลเดอร์ที่ถูกลบในขณะนี้
              </p>
            </div>
          ) : (
            <div className=" rounded-3xl p-2  ">
              <FileList
                files={[...folders, ...files]}
                goToFolder={goToFolder} // ✅ ตอนนี้มี goToFolder แล้ว
                isTrash
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                handlers={{
                  onRestore: handleRestore,
                  onRestoreSelected: handleRestoreSelected,
                  onDeleteSelected: () =>
                    handleDeleteForever(
                      [...folders, ...files].filter((i) =>
                        selectedIds.includes(i.id),
                      ),
                    ),
                  onDelete: handleDeleteForever,
                  onEmptyTrash: handleEmptyTrash,
                  handlePreview: setPreviewFile,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Popups & Modals */}
      <Popup
        show={popup.show}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup({ ...popup, show: false })}
        onConfirm={popup.onConfirm}
        autoClose={!popup.onConfirm}
      />
      <PreviewModal
        show={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </DriveLayout>
  );
}
