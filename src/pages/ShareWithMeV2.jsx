import React, { useState, useEffect } from "react";
import { FiFolder, FiFileText, FiAlertCircle } from "react-icons/fi";
import { API_BASE } from "../api/api";

// Layout & Components
import DriveLayout from "../components/DriveLayout";
import FilePreviewModal from "../components/sharedwithme/FilePreviewModal";
import UploadActions from "../components/sharedwithme/UploadActions";
import DownloadProgress from "../components/DownloadProgress.jsx"; // ✅ เพิ่มตรงนี้

import {
  FolderCard,
  FileCard,
  Breadcrumb,
  SelectionActionBar,
  SelectableItem,
  useFileDownloader,
} from "../components/sharedwithme";

const SharedWithMeV2 = () => {
  // ---------------- STATE ----------------
  const [rootItems, setRootItems] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [autoEntered, setAutoEntered] = useState(false);
  const [userMap, setUserMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
 

  const { downloadSharedFiles } = useFileDownloader();

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const fetchUserById = async (userId, token) => {
    const res = await fetch(`${API_BASE}/Mydrive/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data;
  };

  // ---------------- FETCH ----------------รูป ชื่อ ของผู้ใช้
  const fetchSharedFiles = async () => {
    setLoading(true);
    setSelectedItems([]);

    try {
      const token = localStorage.getItem("api_token");
      if (!token) throw new Error("ไม่พบ Token");

      const res = await fetch(`${API_BASE}/shared-with-me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const sharedItems = json.data;

      // 🔥 ดึง owner_id ไม่ซ้ำ
      const collectOwnerIds = (items, set = new Set()) => {
        items.forEach((item) => {
          if (item.owner_id) set.add(item.owner_id);
          if (item.children?.length) {
            collectOwnerIds(item.children, set);
          }
        });
        return set;
      };

      const ownerIds = [...collectOwnerIds(sharedItems)];

      const users = {};
      for (const id of ownerIds) {
        const user = await fetchUserById(id, token);
        if (user) {
          users[id] = {
            username: user.username || user.name,
            avatar: user.avatar_url,
          };
        }
      }

      console.log("👤 USER MAP:", users);

      setUserMap(users);
      setRootItems(sharedItems);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  // ---------------- AUTO ENTER ROOT ----------------
  useEffect(() => {
    console.log("🔁 auto-enter check", {
      loading,
      autoEntered,
      rootCount: rootItems.length,
      rootItems,
    });

    if (
      !loading &&
      !autoEntered &&
      rootItems.length === 1 &&
      rootItems[0].type === "folder"
    ) {
      console.log("🚪 Auto enter folder:", rootItems[0]);
      setCurrentPath([rootItems[0]]);
      setAutoEntered(true);
    }
  }, [loading, rootItems, autoEntered]);

  // ---------------- HELPERS ----------------
  const getCurrentItems = () => {
    if (currentPath.length === 0) return rootItems;

    let items = rootItems;
    for (const folder of currentPath) {
      const found = items.find((i) => i.id === folder.id);
      items = found?.children || [];
    }
    return items;
  };

  const currentFolder =
    currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;

  // 🔍 LOG สำคัญ

  // ---------------- HANDLERS ----------------
  const handleDoubleClick = (item) => {
    if (item.type === "folder") {
      setCurrentPath([...currentPath, item]);
      setSelectedItems([]);
    } else {
      setSelectedFile(item);
    }
  };

  const handleNavigate = (index) => {
    if (index === -1) setCurrentPath([]);
    else setCurrentPath(currentPath.slice(0, index + 1));

    setSelectedItems([]);
  };

  const handleRefresh = async () => {
    setAutoEntered(false);
    await fetchSharedFiles();
  };

  const handleToggleSelection = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      return exists ? prev.filter((i) => i.id !== item.id) : [...prev, item];
    });
  };

  // ---------------- DELETE ----------------
  const handleDeleteMultiple = async () => {
    if (selectedItems.length === 0) return;

    if (!window.confirm(`ยืนยันการลบ ${selectedItems.length} รายการ?`)) return;

    const token = localStorage.getItem("api_token");
    let success = 0;

    for (const item of selectedItems) {
      try {
        const endpoint = item.type === "folder" ? "folders" : "files";

        const res = await fetch(`${API_BASE}/${endpoint}/${item.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) success++;
      } catch (e) {
        console.error("❌ delete error:", e);
      }
    }

    if (success > 0) {
      alert(`ลบสำเร็จ ${success} รายการ`);
      handleRefresh();
    }
  };

  // ✅ สร้างฟังก์ชันใหม่เพื่อจัดการ progress
  const handleDownloadWithProgress = async () => {
    if (selectedItems.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    // Fake progress
    let fake = 0;
    const interval = setInterval(() => {
      fake += 10;
      if (fake >= 90) clearInterval(interval);
      setDownloadProgress(fake);
    }, 200);

    try {
      await downloadSharedFiles(selectedItems);
      clearInterval(interval);
      setDownloadProgress(100);

      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    } catch (error) {
      clearInterval(interval);
      setIsDownloading(false);
      setDownloadProgress(0);
      alert("ดาวน์โหลดไม่สำเร็จ");
    }
  };

  // ---------------- RENDER ----------------
  if (loading) {
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
      </DriveLayout>
    );
  }

  if (error) {
    return (
      <DriveLayout>
        <div className="flex items-center justify-center h-64 text-red-500 gap-2">
          <FiAlertCircle /> {error}
        </div>
      </DriveLayout>
    );
  }

  const items = getCurrentItems();
  const folders = items.filter((i) => i.type === "folder");
  const files = items.filter((i) => i.type === "file");

  return (
    <DriveLayout>
      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent">
        แชร์กับฉัน
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        รายชื่อผู้ใช้ทั้งหมด ดูและจัดการผู้ใช้ทั้งหมดในระบบ
      </p>
      <div className="p-6 bg-white min-h-full relative pb-24">
        <Breadcrumb currentPath={currentPath} onNavigate={handleNavigate} />

        <UploadActions
          currentFolder={currentFolder}
          canUpload={currentFolder?.allow_edit === true}
          canCreateFolder={currentFolder?.allow_edit === true}
          onRefresh={handleRefresh}
        />

        {folders.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-gray-400">
              <FiFolder /> FOLDERS
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {folders.map((folder) => (
                <SelectableItem
                  key={folder.id}
                  item={folder}
                  isSelected={selectedItems.some((i) => i.id === folder.id)}
                  onToggle={handleToggleSelection}
                  onOpen={handleDoubleClick}
                >
                  <FolderCard
                    folder={folder}
                    sharedUser={userMap[folder.owner_id]}
                  />
                </SelectableItem>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-gray-400">
            <FiFileText /> FILES
          </div>

          {files.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {files.map((file) => (
                <SelectableItem
                  key={file.id}
                  item={file}
                  isSelected={selectedItems.some((i) => i.id === file.id)}
                  onToggle={handleToggleSelection}
                  onOpen={handleDoubleClick}
                >
                  <FileCard file={file} sharedUser={userMap[file.owner_id]} />
                </SelectableItem>
              ))}
            </div>
          ) : (
            folders.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                Folder นี้ว่างเปล่า
              </p>
            )
          )}
        </section>

        {selectedFile && (
          <FilePreviewModal
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}

        <SelectionActionBar
          selectedCount={selectedItems.length}
          
           onDownload={handleDownloadWithProgress}
          onDelete={handleDeleteMultiple}
          onClear={() => setSelectedItems([])}
        />
      </div>
      {/* ✅ เพิ่มก่อนปิด </DriveLayout> */}
      <DownloadProgress
        percent={downloadProgress}
        visible={isDownloading}
        fileName="กำลังดาวน์โหลด..."
        fileCount={selectedItems.length}
        items={selectedItems.map((item) => ({
          name: item.name,
          type: item.type,
          size: item.size,
        }))}
        onClose={() => {
          setIsDownloading(false);
          setDownloadProgress(0);
        }}
      />
    </DriveLayout>
  );
};

export default SharedWithMeV2;
