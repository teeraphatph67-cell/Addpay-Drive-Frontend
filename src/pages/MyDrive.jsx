import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DriveLayout from "../components/DriveLayout";
import FileList from "../components/FileList";
import DownloadProgress from "../components/DownloadProgress.jsx";
import PreviewModal from "../components/PreviewModal";
import Popup from "../components/Popup.jsx";
import RenameModal from "../components/RenameModal.jsx";
import SearchFilter from "../components/SearchFilter.jsx";
import { API_BASE, BASE_URL } from "../api/api.js";
import { FiFolder, FiFile, FiImage } from "react-icons/fi";

import PageHeader from "../components/PageHeader.jsx";

export default function MyDrive() {
  const { id: folderIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isShareViewer = location.pathname.includes("/share/");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const currentFolderId = folderIdParam ? Number(folderIdParam) : null;
  const [selectedItems, setSelectedItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [path, setPath] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null });
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
    onConfirm: null,
  });

  // State สำหรับค้นหา
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchResults, setSearchResults] = useState({
    folders: [],
    files: [],
  });
  const searchTimeoutRef = useRef(null);

  const uploadButtonRef = useRef();
  const token = localStorage.getItem("api_token");

  useEffect(() => {
    const token = localStorage.getItem("api_token");

    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // รีเซ็ตการค้นหาเมื่อเปลี่ยนโฟลเดอร์
  useEffect(() => {
    setSearchTerm("");
    setSearchDate("");
    setSearchResults({ folders: [], files: [] });
  }, [currentFolderId]);

  // ---------------- Navigation ----------------
  const goToFolder = (id) =>
    navigate(id ? `/mydrive/folder/${id}` : "/mydrive");

  const showPopup = (msg, type = "success") =>
    setPopup({ show: true, message: msg, type, onConfirm: null });

  // ---------------- Flatten folders Helper ----------------
  const flattenFolders = (folders) => {
    let result = [];
    folders.forEach((f) => {
      result.push(f);
      if (f.children_recursive_active?.length)
        result = result.concat(flattenFolders(f.children_recursive_active));
    });
    return result;
  };

  // ---------------- ฟังก์ชันค้นหาจาก API ----------------
  const handleSearch = async (q, date = "") => {
    if (!q.trim() && !date) {
      setSearchResults({ folders: [], files: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      let url = `${API_BASE}/my-drive/search?q=${encodeURIComponent(q)}`;
      if (date) {
        url += `&date=${date}`;
      }

      console.log("Searching:", url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("Search results:", data);

      if (data.status) {
        const searchFolders = (data.folders || []).map((f) => ({
          ...f,
          isFolder: true,
          key: `folder-${f.id}`,
          name: f.name,
          favorite: f.is_starred === 1,
          breadcrumb: f.breadcrumb || [],
        }));

        // ใน handleSearch function - แก้ไขการสร้าง file_url จาก file_path
        const searchFiles = (data.files || []).map((f) => {
          let fileUrl = null;
          let thumbnailUrl = null;

          console.log("Raw file data:", f);

          // มี file_path ให้สร้าง URL จาก BASE_URL/storage/
          if (f.file_path) {
            // ลบ / ข้างหน้าออกถ้ามี และสร้าง URL เต็ม
            const cleanPath = f.file_path.replace(/^\/+/, "");
            fileUrl = `${BASE_URL}${cleanPath}`;

            console.log(`File ${f.id} - created URL from file_path:`, fileUrl);

            // ตรวจสอบว่าเป็นรูปภาพหรือไม่
            const isImage =
              f.mime_type?.startsWith("image/") ||
              f.file_name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

            if (isImage) {
              thumbnailUrl = fileUrl;
            }
          }
          // ถ้าไม่มี file_path แต่มี url_file
          else if (f.url_file) {
            fileUrl = f.url_file;
            console.log(`File ${f.id} - using url_file:`, fileUrl);
          }
          // ถ้าไม่มีอะไรเลย ให้สร้างจาก API endpoint
          else if (f.id) {
            fileUrl = `${BASE_URL}/api/v1/files/${f.id}`;
            console.log(`File ${f.id} - using API endpoint:`, fileUrl);
          }

          return {
            ...f,
            id: f.id,
            isFolder: false,
            key: `file-${f.id}`,
            file_name: f.file_name,
            file_url: fileUrl,
            name: f.file_name,
            favorite: f.is_starred === 1,
            breadcrumb: f.breadcrumb || [],
            file_url: fileUrl, // URL ที่สร้างจาก file_path
            file_path: f.file_path, // เก็บ file_path ไว้ด้วย
            thumbnail: thumbnailUrl,
            mime_type:
              f.mime_type ||
              (f.file_name?.toLowerCase().endsWith(".mov")
                ? "video/quicktime"
                : null),
            size: f.size,
            created_at: f.created_at,
          };
        });

        setSearchResults({
          folders: searchFolders,
          files: searchFiles,
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      showPopup("ค้นหาล้มเหลว", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim() && !searchDate) {
      setSearchResults({ folders: [], files: [] });
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value, searchDate);
    }, 500);
  };

  const handleDateChange = (date) => {
    setSearchDate(date);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim() && !date) {
      setSearchResults({ folders: [], files: [] });
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchTerm, date);
    }, 500);
  };

  // ---------------- Fetch Data & Build Path ----------------
  const fetchFiles = async (userId, parentId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/Mydrive/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) return;

      const drive = data.data.drive;

      const allFoldersRaw = flattenFolders(drive.folders_active || []);
      const allFolders = allFoldersRaw.map((f) => ({
        ...f,
        isFolder: true,
        key: `folder-${f.id}`,
        name: f.name,
        favorite: f.is_starred === 1,
      }));

      const collectFiles = (folders) => {
        let result = [];
        folders.forEach((folder) => {
          if (folder.files_active?.length) {
            result.push(
              ...folder.files_active.map((f) => ({
                ...f,
                isFolder: false,
                key: `file-${f.id}`,
                file_name: f.file_name || f.name,
                file_url: f.file_path
                  ? `${BASE_URL}/storage/${f.file_path.replace(/^\/+/, "")}`
                  : f.url_file || null,
                favorite: f.is_starred === 1,
                mime_type: f.mime_type,
              })),
            );
          }
          if (folder.children_recursive_active?.length)
            result.push(...collectFiles(folder.children_recursive_active));
        });
        return result;
      };

      const allFilesFromFolders = collectFiles(drive.folders_active || []);
      // ใน fetchFiles function - แก้ไขการสร้าง file_url จาก file_path
      const filesRoot = (drive.files_active || []).map((f) => ({
        ...f,
        isFolder: false,
        key: `file-${f.id}`,
        file_name: f.file_name || f.name,
        // สร้าง URL จาก file_path
        file_url: f.file_path
          ? `${BASE_URL}/storage/${f.file_path.replace(/^\/+/, "")}`
          : f.url_file || null,
        favorite: f.is_starred === 1,
        mime_type:
          f.mime_type ||
          (f.file_name?.toLowerCase().endsWith(".mov")
            ? "video/quicktime"
            : null),
      }));

      const allFiles = [...filesRoot, ...allFilesFromFolders];

      setFolders(
        allFolders.filter((f) =>
          parentId ? f.parent_id === parentId : f.parent_id === null,
        ),
      );
      setFiles(
        parentId
          ? allFiles.filter((f) => f.folder_id === parentId)
          : allFiles.filter((f) => !f.folder_id),
      );

      const buildPath = (all, id) => {
        if (!id) return [];
        let p = [];
        let current = all.find((x) => x.id === id);
        while (current) {
          p.unshift({ id: current.id, name: current.name });
          current = all.find((x) => x.id === current.parent_id);
        }
        return p;
      };
      setPath(parentId ? buildPath(allFolders, parentId) : []);
    } catch (err) {
      console.error(err);
      showPopup("❌ โหลดข้อมูลไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.id) fetchFiles(user.id, currentFolderId);
  }, [currentFolderId]);

  // ---------------- Download ----------------
  const handleDownload = async (items = selectedItems) => {
    const itemsToDownload = items && items.length ? items : selectedItems;

    if (!itemsToDownload.length) {
      alert("กรุณาเลือกไฟล์/โฟลเดอร์");
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      let fake = 0;
      const interval = setInterval(() => {
        fake += 10;
        if (fake >= 90) {
          clearInterval(interval);
        }
        setDownloadProgress(fake);
      }, 200);

      if (itemsToDownload.length === 1 && !itemsToDownload[0].isFolder) {
        const file = itemsToDownload[0];
        const response = await fetch(
          `${BASE_URL}api/v1/download/file/${file.id}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) throw new Error();
        const blob = await response.blob();
        downloadBlob(blob, file.file_name || `file_${file.id}`);
      } else {
        const itemsPayload = itemsToDownload.map((i) => ({
          id: i.id,
          type: i.isFolder ? "folder" : "file",
        }));

        const response = await fetch(`${BASE_URL}api/v1/download/multiple`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: itemsPayload }),
        });

        if (!response.ok) throw new Error();
        const blob = await response.blob();
        downloadBlob(blob, `drive_download_${Date.now()}.zip`);
      }

      clearInterval(interval);
      setDownloadProgress(100);

      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
      setDownloadProgress(0);
      alert("❌ ดาวน์โหลดไม่สำเร็จ");
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // ---------------- Other Handlers ----------------
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
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles(JSON.parse(localStorage.getItem("user")).id, currentFolderId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/AddFolder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ drive_id: 1, parent_id: currentFolderId, name }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        fetchFiles(
          JSON.parse(localStorage.getItem("user")).id,
          currentFolderId,
        );
        showPopup(`สร้างโฟลเดอร์ "${name}" สำเร็จ`);
      } else {
        console.error("Backend Error:", data);
        showPopup(data.message || "ไม่มีสิทธิ์สร้างโฟลเดอร์", "error");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      showPopup("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  const handleRename = (item) => setRenameModal({ isOpen: true, item });
  const handleRenameSuccess = () => {
    fetchFiles(JSON.parse(localStorage.getItem("user")).id, currentFolderId);
    showPopup("เปลี่ยนชื่อสำเร็จ");
  };

  const handleDeleteSelected = async () => {
    const file_ids = selectedItems.filter((i) => !i.isFolder).map((i) => i.id);
    const folder_ids = selectedItems.filter((i) => i.isFolder).map((i) => i.id);
    await fetch(`${API_BASE}/trash/bulk-move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ file_ids, folder_ids }),
    });
    setSelectedItems([]);
    fetchFiles(JSON.parse(localStorage.getItem("user")).id, currentFolderId);
    showPopup("ย้ายไปถังขยะแล้ว");
  };

  const confirmDeleteSelectedPopup = () => {
    if (!selectedItems.length) return;
    setPopup({
      show: true,
      type: "warning",
      message: `ย้าย ${selectedItems.length} รายการไปถังขยะใช่ไหม?`,
      onConfirm: handleDeleteSelected,
    });
  };

  const handlePreview = (file) => setPreviewFile(file);

  const displayFolders =
    searchTerm || searchDate ? searchResults.folders : folders;
  const displayFiles = searchTerm || searchDate ? searchResults.files : files;

  // ฟังก์ชันสำหรับแสดง thumbnail
  const renderThumbnail = (item) => {
  if (item.type === "folder") return <FiFolder />;

  const fileUrl = `${BASE_URL}${item.file_path}`;

  const fileName = item.file_name || "";
  const ext = fileName.split(".").pop()?.toLowerCase();

  const isImage =
    item.mime_type?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);

  const isVideo =
    item.mime_type?.startsWith("video/") ||
    ["mp4", "mov", "avi", "mkv"].includes(ext);

  if (isImage) {
    return (
      <img
        src={fileUrl}
        className="w-10 h-10 object-cover rounded-lg"
      />
    );
  }

  if (isVideo) {
    return (
      <video
        src={fileUrl}
        className="w-10 h-10 object-cover rounded-lg"
      />
    );
  }

  return <FiFile />;
};

  return (
    <>
      {/* Loading Spinner - แสดงเฉพาะตอนโหลดข้อมูลหน้าแรก */}
      {loading && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl px-8 py-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] text-center max-w-xs w-full">
            <div className="relative mx-auto mb-5 w-14 h-14">
              <div className="absolute inset-0 rounded-full border-[3px] border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-800 font-semibold text-sm">
              กำลังโหลดข้อมูล
            </p>
            <p className="text-xs text-slate-500 mt-1">กรุณารอสักครู่…</p>
          </div>
        </div>
      )}

      {!isShareViewer ? (
        <DriveLayout
          currentFolderId={currentFolderId}
          uploadButtonRef={uploadButtonRef}
          onUploadClick={() =>
            fetchFiles(
              JSON.parse(localStorage.getItem("user")).id,
              currentFolderId,
            )
          }
          onCreateFolder={handleCreateFolder}
        >
          <PageHeader
            title="ไดรฟ์ของฉัน"
            subtitle="ไฟล์และโฟลเดอร์ทั้งหมดของคุณ"
          />


          <SearchFilter
            search={searchTerm}
            setSearch={handleSearchChange}
            dateFrom={searchDate}
            setDateFrom={handleDateChange}
            dateTo=""
            setDateTo={() => {}}
            suggestions={[]}
            searchResults={searchResults}
            showDropdown={searchTerm.length > 0}
            isLoading={isSearching}
            onSelectResult={(item) => {
              if (item.isFolder) {
                goToFolder(item.id);
              } else {
                handlePreview(item);
              }
              setSearchTerm("");
            }}
          />
<br />
          {(searchTerm || searchDate) && (
            <div className="mt-4 mb-2 px-4 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
              พบ {displayFolders.length + displayFiles.length} รายการ
              {searchTerm && <span> สำหรับคำว่า "{searchTerm}"</span>}
              {searchDate && <span> วันที่ {searchDate}</span>}
            </div>
          )}

          <FileList
            files={[...displayFolders, ...displayFiles]}
            path={path}
            currentParent={currentFolderId}
            goToFolder={goToFolder}
            renderThumbnail={renderThumbnail}
            handlers={{
              onPreview: handlePreview,
              onDelete: (item) =>
                setPopup({
                  show: true,
                  type: "warning",
                  message: `ย้าย "${item.name || item.file_name}" ไปถังขยะ?`,
                  onConfirm: async () => {
                    const url = item.isFolder
                      ? `${API_BASE}/folder/${item.id}`
                      : `${API_BASE}/files/${item.id}`;
                    await fetch(url, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    fetchFiles(
                      JSON.parse(localStorage.getItem("user")).id,
                      currentFolderId,
                    );
                    showPopup("ย้ายไปถังขยะแล้ว");
                  },
                }),
              onRename: handleRename,
              onDeleteSelected: confirmDeleteSelectedPopup,
              onDownload: handleDownload,
              onFavorite: handleFavorite,
              handleUploadFiles: (f) =>
                uploadButtonRef.current?.handleUploadFiles(f),
            }}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            isLoading={loading || isSearching}
          />

          <PreviewModal
            show={!!previewFile}
            file={previewFile}
            onClose={() => setPreviewFile(null)}
          />
          <RenameModal
            isOpen={renameModal.isOpen}
            item={renameModal.item}
            onClose={() => setRenameModal({ isOpen: false, item: null })}
            onRenameSuccess={handleRenameSuccess}
          />
          <Popup
            show={popup.show}
            message={popup.message}
            type={popup.type}
            onClose={() => setPopup({ ...popup, show: false })}
            onConfirm={popup.onConfirm}
          />
          <DownloadProgress
            percent={downloadProgress}
            visible={isDownloading}
            onDownload={handleDownload}
            fileName={
              selectedItems.length === 1
                ? selectedItems[0].name || selectedItems[0].file_name
                : `${selectedItems.length} รายการ`
            }
            fileSize={selectedItems.reduce(
              (total, item) => total + (item.size || 0),
              0,
            )}
            fileCount={selectedItems.length}
            items={selectedItems.map((item) => ({
              name: item.name || item.file_name,
              type: item.isFolder ? "folder" : "file",
              size: item.size,
            }))}
            onClose={() => {
              setIsDownloading(false);
              setDownloadProgress(0);
            }}
          />
        </DriveLayout>
      ) : null}
    </>
  );
}
