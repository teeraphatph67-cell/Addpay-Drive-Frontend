import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FiStar, FiChevronRight, FiTrash2 } from "react-icons/fi";
import DriveLayout from "../components/DriveLayout";
import FileList from "../components/FileList";
import PreviewModal from "../components/PreviewModal";
import Popup from "../components/Popup.jsx";
import RenameModal from "../components/RenameModal.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { API_BASE, BASE_URL } from "../api/api.js";

export default function Starred() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState([]);
  const [currentParent, setCurrentParent] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null });
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
    onConfirm: null,
  });

  const token = localStorage.getItem("api_token");

  // --- Helpers ---
  const showPopup = useCallback(
    (msg, type = "success") =>
      setPopup({ show: true, message: msg, type, onConfirm: null }),
    [],
  );

  const flattenStarredFolders = useCallback((foldersList) => {
    let result = [];
    foldersList.forEach((f) => {
      result.push(f);
      if (f.children_recursive_active?.length) {
        result = result.concat(
          flattenStarredFolders(f.children_recursive_active),
        );
      }
    });
    return result;
  }, []);

  const collectFiles = useCallback((foldersList) => {
    let result = [];
    foldersList.forEach((f) => {
      (f.starred_files || []).forEach((file) => {
        result.push({
          ...file,
          isFolder: false,
          favorite: true,
          parent_id: f.id,
          file_url: file.file_path
            ? `${BASE_URL}/${file.file_path.replace(/^\/+/, "")}`
            : file.url_file || null,
        });
      });
      if (f.children_recursive_active?.length) {
        result.push(...collectFiles(f.children_recursive_active));
      }
    });
    return result;
  }, []);

  // --- Fetch Data ---
  const fetchStarred = useCallback(async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) return;

      const res = await fetch(`${API_BASE}/User_Drive_Starred/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return;

      const drive = data.data;
      const allFolders = flattenStarredFolders(drive.starred_folders || []).map(
        (f) => ({
          ...f,
          isFolder: true,
          favorite: true,
        }),
      );

      const filesFromFolders = collectFiles(drive.starred_folders || []);
      const rootFiles = (drive.starred_files || [])
        .filter((f) => f.is_starred === 1)
        .map((f) => ({
          ...f,
          isFolder: false,
          favorite: true,
          parent_id: null,
          file_url: f.file_path
            ? `${BASE_URL}/${f.file_path.replace(/^\/+/, "")}`
            : f.url_file || null,
        }));

      const allFiles = [...filesFromFolders, ...rootFiles];
      const parentId = currentParent === null ? null : Number(currentParent);

      setFolders(allFolders.filter((f) => f.parent_id === parentId));
      setFiles(allFiles.filter((f) => f.parent_id === parentId));

      const buildPath = (id) => {
        let p = [];
        let f = allFolders.find((x) => x.id === id);
        while (f) {
          p.unshift({ id: f.id, name: f.name });
          f = allFolders.find((x) => x.id === f.parent_id);
        }
        return p;
      };
      setPath(currentParent ? buildPath(currentParent) : []);
    } catch (err) {
      showPopup("❌ โหลดข้อมูลไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [token, currentParent, flattenStarredFolders, collectFiles, showPopup]);

  useEffect(() => {
    fetchStarred();
  }, [fetchStarred]);

  // --- Actions ---
  const goToFolder = (id) => setCurrentParent(id);

  const handleFavorite = async (id, newValue, isFolder = true) => {
    try {
      const url = isFolder
        ? newValue
          ? `${API_BASE}/Favorite_Folder/${id}`
          : `${API_BASE}/RemoveFavorite/${id}`
        : newValue
          ? `${API_BASE}/favoriteFile/${id}`
          : `${API_BASE}/RemoveFavoriteFile/${id}`;

      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      fetchStarred();
    } catch (err) {
      showPopup("❌ ไม่สามารถเปลี่ยนสถานะดาวได้", "error");
    }
  };

  const confirmDelete = (items) => {
    const itemsArray = Array.isArray(items) ? items : [items];
    setPopup({
      show: true,
      type: "warning",
      message: `ย้าย ${itemsArray.length} รายการไปถังขยะใช่หรือไม่?`,
      onConfirm: async () => {
        const file_ids = itemsArray.filter((i) => !i.isFolder).map((i) => i.id);
        const folder_ids = itemsArray
          .filter((i) => i.isFolder)
          .map((i) => i.id);
        await fetch(`${API_BASE}/trash/bulk-move`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ file_ids, folder_ids }),
        });
        showPopup("🗑 ย้ายไปถังขยะแล้ว!");
        setSelectedItems([]);
        fetchStarred();
      },
    });
  };

  const mergedList = useMemo(() => [...folders, ...files], [folders, files]);

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

      <div className="max-w-[1600px] mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              รายการติดดาว
            </h1>
            <nav className="flex items-center gap-1 mt-2 text-sm text-gray-400">
              <button
                onClick={() => goToFolder(null)}
                className="hover:text-amber-500 transition"
              >
                ติดดาว
              </button>
              {path.map((p) => (
                <React.Fragment key={p.id}>
                  <FiChevronRight size={14} />
                  <button
                    onClick={() => goToFolder(p.id)}
                    className="hover:text-amber-500 transition max-w-[140px] truncate"
                  >
                    {p.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-2 shadow-sm animate-in fade-in slide-in-from-right-2">
              <span className="text-xs font-semibold text-red-600">
                เลือกแล้ว {selectedItems.length} รายการ
              </span>
              <button
                onClick={() => confirmDelete(selectedItems)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition shadow-sm"
              >
                <FiTrash2 size={14} /> ย้ายไปถังขยะ
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="relative min-h-[500px]">
          {/* Wrapper for Content */}
          <div>
            {!loading && mergedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                  <FiStar size={36} className="text-amber-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">
                  ยังไม่มีรายการที่ติดดาว
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  ไฟล์หรือโฟลเดอร์ที่คุณติดดาวจะปรากฏที่นี่
                </p>
              </div>
            ) : (
              <FileList
                files={mergedList}
                goToFolder={goToFolder}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                handlers={{
                  onPreview: setPreviewFile,
                  onDelete: (item) => confirmDelete(item),
                  onRename: (item) => setRenameModal({ isOpen: true, item }),
                  onDeleteSelected: () => confirmDelete(selectedItems),
                  onFavorite: handleFavorite,
                }}
                isLoading={loading}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        <PreviewModal
          show={!!previewFile}
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
        <RenameModal
          isOpen={renameModal.isOpen}
          onClose={() => setRenameModal({ isOpen: false, item: null })}
          item={renameModal.item}
          onRenameSuccess={() => {
            fetchStarred();
            showPopup("✅ เปลี่ยนชื่อสำเร็จ!");
          }}
        />
        <Popup
          show={popup.show}
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ ...popup, show: false })}
          onConfirm={popup.onConfirm}
          autoClose={!popup.onConfirm}
        />
      </div>
    </DriveLayout>
  );
}
