import { useEffect, useState } from "react";
import { TbFolderFilled } from "react-icons/tb";
import { useNavigate, useParams } from "react-router-dom";
import DriveLayout from "../components/DriveLayout";
import { API_BASE, BASE_URL } from "../api/api.js";
import MenuActions from "../components/MenuActions";
import SearchFilter from "../components/SearchFilter.jsx";
import DownloadProgress from "../components/DownloadProgress.jsx";
import { FiImage, FiX } from "react-icons/fi";

const AdminDriveUsers = () => {
  const { driveId, folderId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const token = localStorage.getItem("api_token");
  const [videoThumbnails, setVideoThumbnails] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const generateVideoThumbnail = (file) => {
    if (videoThumbnails[file.id]) return;

    const video = document.createElement("video");
    video.src = `${BASE_URL}${file.file_path}`;
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.addEventListener("loadeddata", () => {
      video.currentTime = 1;
    });

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      canvas
        .getContext("2d")
        .drawImage(video, 0, 0, canvas.width, canvas.height);

      setVideoThumbnails((prev) => ({
        ...prev,
        [file.id]: canvas.toDataURL("image/jpeg", 0.8),
      }));

      video.remove();
    });
  };

  const isImageFile = (file) => {
    if (file?.mime_type) {
      return file.mime_type.startsWith("image/");
    }
    if (file?.file_name) {
      const imageExts = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "svg",
        "bmp",
        "ico",
      ];
      const ext = file.file_name.split(".").pop()?.toLowerCase();
      return imageExts.includes(ext);
    }
    return false;
  };

  const isVideoFile = (file) => {
    if (file?.mime_type) {
      return file.mime_type.startsWith("video/");
    }
    if (file?.file_name) {
      const videoExts = ["mov", "mp4", "avi", "mkv", "webm", "flv", "wmv"];
      const ext = file.file_name.split(".").pop()?.toLowerCase();
      return videoExts.includes(ext);
    }
    return false;
  };

  const handleDownload = async (items) => {
    if (!items || !items.length) {
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

      if (items.length === 1 && !items[0].isFolder) {
        const file = items[0];
        const response = await fetch(
          `${BASE_URL}api/v1/admin/files/${file.id}/download`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) throw new Error();
        const blob = await response.blob();
        downloadBlob(blob, file.file_name || `file_${file.id}`);
      } else {
        const itemsPayload = items.map((i) => ({
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

  const goToBreadcrumb = (index) => {
    if (index === -1) {
      navigate(`/driveuser/${driveId}`);
      setCurrentFolder(null);
      setFolderStack([]);
      return;
    }

    const folder = folderStack[index];
    navigate(`/driveuser/${driveId}/folder/${folder.id}`);

    const newStack = folderStack.slice(0, index);
    setCurrentFolder(folder);
    setFolderStack(newStack);
  };

  // ✅ โหลดข้อมูลโฟลเดอร์เมื่อมี folderId (ใช้ API browse)
  useEffect(() => {
  const fetchDriveOrFolder = async () => {
    if (!driveId) return;

    setLoading(true);

    try {
      let url = `${API_BASE}/admin/drives/${driveId}/browse`;

      // ⭐ ถ้ามี folderId → เข้าโฟลเดอร์
      if (folderId) {
        url += `?folder_id=${folderId}`;
      }

      console.log("Fetching:", url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      console.log("Response:", json);

      if (!json.status) return;

      // 🟣 ===== อยู่ในโฟลเดอร์ =====
      if (folderId) {
        const folderData = {
          id: parseInt(folderId),
          name: json.breadcrumb?.slice(-1)[0]?.name || "โฟลเดอร์",
          children_recursive_active: json.folders || [],
          files_active: json.files || [],
          breadcrumb: json.breadcrumb || [],
        };

        setCurrentFolder(folderData);
        setFolderStack(json.breadcrumb.slice(0, -1) || []);
      } 
      // 🔵 ===== อยู่ Root Drive =====
      else {
        setCurrentFolder({
          id: driveId,
          name: "My Drive",
          children_recursive_active: json.folders || [],
          files_active: json.files || [],
          breadcrumb: [],
        });

        setFolderStack([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchDriveOrFolder();
}, [driveId, folderId, token]);

  // ✅ โหลดข้อมูล users (เมื่อไม่มี id)
  useEffect(() => {
    const fetchUsers = async () => {
      if (driveId) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        setUsers(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [driveId, token]);

  const folders = searchResult
    ? searchResult.folders || []
    : currentFolder
      ? currentFolder.children_recursive_active || []
      : drive?.drive?.folders_active || [];

  const files = searchResult
    ? searchResult.files || []
    : currentFolder
      ? currentFolder.files_active || []
      : drive?.drive?.files_active || [];

  const openFolder = (folder) => {
    navigate(`/driveuser/${driveId}/folder/${folder.id}`);
  };

  const goBackFolder = () => {
    if (!folderStack.length) {
      navigate(`/driveuser/${driveId}`);
      return;
    }

    const parent = folderStack[folderStack.length - 1];
    navigate(`/driveuser/${driveId}/folder/${parent.id}`);
  };

  // ค้นหา----------------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminDrives();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, dateFrom, dateTo, driveId]);

  const fetchAdminDrives = async () => {
    const params = new URLSearchParams();

    if (search.trim()) params.append("q", search);
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    console.log("Search params:", params.toString());

    if ([...params].length === 0) {
      console.log("No search params, clearing search result");
      setSearchResult(null);
      return;
    }

    setIsSearching(true);

    try {
      if (driveId) {
        const url = `${API_BASE}/admin/drives/${driveId}/search?${params.toString()}`;
        console.log("Searching user drive:", url);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        console.log("Search results:", json);

        setSearchResult({
          folders: (json.folders || []).map((f) => ({
            ...f,
            isFolder: true,
            breadcrumb: f.breadcrumb || [],
          })),
          files: (json.files || []).map((f) => ({
            ...f,
            isFolder: false,
            file_path: f.file_path || `uploads/user-${driveId}/${f.file_name}`,
          })),
        });
      } else {
        const url = `${API_BASE}/users?${params.toString()}`;
        console.log("Searching users:", url);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        console.log("User search results:", json);

        let filteredUsers = json.data || [];

        if (search.trim()) {
          const searchLower = search.toLowerCase();
          filteredUsers = filteredUsers.filter(
            (user) =>
              (user.email && user.email.toLowerCase().includes(searchLower)) ||
              (user.name && user.name.toLowerCase().includes(searchLower)) ||
              (user.username &&
                user.username.toLowerCase().includes(searchLower)),
          );
        }

        setSearchResult({
          users: filteredUsers,
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchUserSuggestions = async () => {
      if (!search.trim()) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/users?search=${search}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        setSuggestions(json.data || []);
        setShowDropdown(json.data?.length > 0);
      } catch (err) {
        console.error("Error fetching user suggestions:", err);
        setSuggestions([]);
        setShowDropdown(false);
      }
    };

    const timer = setTimeout(fetchUserSuggestions, 300);
    return () => clearTimeout(timer);
  }, [search, token]);

  const handleSelectSuggestion = (item) => {
    setSearch(item.email || item.name);
    setShowDropdown(false);
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบโฟลเดอร์นี้?")) return;

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/admin/folders/${folderId}/destroy`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        alert("ลบโฟลเดอร์สำเร็จ");
        window.location.reload();
      }
    } catch (error) {
      console.error("Delete folder error:", error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบไฟล์นี้ถาวร?")) return;

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/admin/files/${fileId}/destroy-forever`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        alert("ลบไฟล์สำเร็จ");
        window.location.reload();
      }
    } catch (error) {
      console.error("Delete file error:", error);
    }
  };

  return (
    <DriveLayout>
      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent">
        ไดรฟ์ของผู้ใช้ทั้งหมด
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        {driveId
          ? "จัดการไฟล์และโฟลเดอร์ของผู้ใช้"
          : "ดูและจัดการไดรฟ์ของผู้ใช้ทั้งหมดในระบบ"}
      </p>
      <SearchFilter
        search={search}
        setSearch={setSearch}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        suggestions={suggestions}
        showDropdown={showDropdown}
        onSelectSuggestion={handleSelectSuggestion}
        searchResults={searchResult}
        onSelectResult={(item) => {
          console.log("Selected item:", item);

          if (item.isFolder) {
            navigate(`/driveuser/${driveId}/folder/${item.id}`);
          } else {
            setPreviewFile(item);
          }
          setSearch("");
          setSearchResult(null);
        }}
        isLoading={isSearching}
      />

      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          {driveId && (
            <button
              onClick={() =>
                currentFolder ? goBackFolder() : navigate("/driveuser")
              }
              className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200"
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-3 h-3 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </div>
              <span className="font-medium text-blue-700">
                {currentFolder ? "ย้อนกลับ" : "หน้าผู้ใช้ทั้งหมด"}
              </span>
            </button>
          )}

          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent">
              {driveId
                ? `ไดรฟ์ของผู้ใช้ ${drive?.email ? `(${drive.email})` : ""}`
                : ""}
            </h1>
          </div>

          <div>
            {driveId ? (
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                />
              </svg>
            ) : (
              ""
            )}
          </div>
        </div>

        {/* BREADCRUMB */}
        {driveId && !loading && (
          <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
            <button
              onClick={() => goToBreadcrumb(-1)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>My Drive</span>
            </button>

            {folderStack.map((folder, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <button
                  onClick={() => goToBreadcrumb(index)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span className="max-w-[120px] truncate">{folder?.name}</span>
                </button>
              </div>
            ))}

            {currentFolder && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span className="max-w-[150px] truncate font-medium">
                    {currentFolder.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* USERS LIST */}
        {!loading && !driveId && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
            {(() => {
              const displayUsers = searchResult ? searchResult.users : users;

              if (displayUsers && displayUsers.length > 0) {
                return displayUsers.map((u) => {
                  const userItem = {
                    id: u.id,
                    name: u.email,
                    isFolder: true,
                    isUser: true,
                  };
                  return (
                    <div
                      key={u.id}
                      className="relative group cursor-pointer bg-white rounded-2xl p-4 shadow-sm"
                      onClick={() => navigate(`/driveuser/${u.drive_id}`)}
                    >
                      <TbFolderFilled className="text-blue-500 text-6xl mx-auto mb-3" />
                      <p className="text-center text-sm truncate">{u.email}</p>

                      <div
                        className="absolute top-3 right-3 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuActions
                          item={userItem}
                          view="admin"
                          handlers={{
                            onDelete: (item) => handleDeleteFolder(item.id),
                            onDownload: handleDownload,
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              } else {
                return (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    {searchResult ? "ไม่พบผู้ใช้ที่ค้นหา" : "ไม่พบผู้ใช้ในระบบ"}
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* DRIVE CONTENT */}
        {!loading && driveId && (drive || currentFolder) && (
          <>
            {/* FOLDERS */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6 mb-10">
              {folders && folders.length > 0 ? (
                folders.map((folder) => {
                  const folderItem = { ...folder, isFolder: true };
                  return (
                    <div
                      key={folder.id}
                      className="relative group cursor-pointer bg-white rounded-2xl p-4 shadow-sm"
                      onClick={() => {
                        if (searchResult) {
                          navigate(`/driveuser/${driveId}/folder/${folder.id}`);
                          setSearchResult(null);
                          setSearch("");
                        } else {
                          openFolder(folder);
                        }
                      }}
                    >
                      <TbFolderFilled className="text-yellow-500 text-6xl mx-auto mb-3" />
                      <p className="text-center text-sm truncate">
                        {folder.name}
                      </p>
                      <div
                        className="absolute top-3 right-3 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuActions
                          item={folderItem}
                          view="admin"
                          handlers={{
                            onDelete: (item) => handleDeleteFolder(item.id),
                            onDownload: handleDownload,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  ไม่พบโฟลเดอร์
                </div>
              )}
            </div>

            {/* FILES */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
              {files && files.length > 0 ? (
                files.map((file) => {
                  // สร้าง file path ถ้าไม่มี
                  const filePath =
                    file.file_path ||
                    `uploads/user-${driveId}/folder-${currentFolder?.id || "root"}/${file.file_name}`;
                  const fileUrl = `${BASE_URL}${filePath}`;

                  const fileItem = {
                    ...file,
                    id: file.id,
                    file_name: file.file_name,
                    file_path: filePath,
                    isFolder: false,
                  };

                  return (
                    <div
                      key={file.id}
                      className="cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-md p-3 transition relative group"
                      onClick={() => setPreviewFile(fileItem)}
                    >
                      {/* ✅ แยกกรณีระหว่างรูปภาพและวิดีโอ */}
                      {isImageFile(file) ? (
                        // กรณีเป็นรูปภาพ
                        <img
                          src={fileUrl}
                          alt={file.file_name}
                          className="w-full h-32 object-cover rounded-xl mb-2"
                          onError={(e) => {
                            console.log("Error loading image:", e.target.src);
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            const parent = e.target.parentNode;
                            const fallback = document.createElement("div");
                            fallback.className =
                              "h-32 flex items-center justify-center bg-gray-100 rounded-xl mb-2 text-xs font-bold text-gray-500";
                            fallback.textContent =
                              file.file_name?.split(".").pop()?.toUpperCase() ||
                              "FILE";
                            parent.insertBefore(fallback, e.target);
                          }}
                        />
                      ) : isVideoFile(file) && videoThumbnails[file.id] ? (
                        // กรณีเป็นวิดีโอและมี thumbnail แล้ว
                        <img
                          src={videoThumbnails[file.id]}
                          alt={file.file_name}
                          className="w-full h-32 object-cover rounded-xl mb-2"
                          onError={(e) => {
                            console.log(
                              "Error loading thumbnail:",
                              e.target.src,
                            );
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            const parent = e.target.parentNode;
                            const fallback = document.createElement("div");
                            fallback.className =
                              "h-32 flex items-center justify-center bg-indigo-100 rounded-xl mb-2 text-xs font-bold text-indigo-700";
                            fallback.innerHTML = `<span class="mr-1">🎬</span>${
                              file.file_name?.split(".").pop()?.toUpperCase() ||
                              "VIDEO"
                            }`;
                            parent.insertBefore(fallback, e.target);
                          }}
                        />
                      ) : isVideoFile(file) ? (
                        // กรณีเป็นวิดีโอที่ยังไม่มี thumbnail - แสดงไอคอนและสร้าง thumbnail
                        <div
                          className="h-32 flex items-center justify-center bg-indigo-100 rounded-xl mb-2 text-xs font-bold text-indigo-700 cursor-pointer"
                          ref={(el) => {
                            if (el && !videoThumbnails[file.id]) {
                              generateVideoThumbnail(file);
                            }
                          }}
                        >
                          <span className="mr-1">🎬</span>
                          {file.file_name?.split(".").pop()?.toUpperCase() ||
                            "VIDEO"}
                        </div>
                      ) : (
                        // กรณีไฟล์อื่นๆ
                        <div className="h-32 flex items-center justify-center bg-gray-100 rounded-xl mb-2 text-xs font-bold text-gray-500">
                          {file.file_name?.split(".").pop()?.toUpperCase() ||
                            "FILE"}
                        </div>
                      )}

                      <p className="text-center text-sm truncate">
                        {file.file_name}
                      </p>

                      <div
                        className="absolute top-3 right-3 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuActions
                          item={fileItem}
                          view="admin"
                          handlers={{
                            onDelete: (item) => handleDeleteFile(item.id),
                            onDownload: handleDownload,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  ไม่พบไฟล์
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Preview */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          onClick={() => setPreviewFile(null)}
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
                  <div className="font-semibold">{previewFile.file_name}</div>
                  <div className="text-xs text-gray-500">
                    {previewFile.mime_type || "ไฟล์"}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* ===== CONTENT ===== */}
            <div className="bg-gray-100 flex items-center justify-center min-h-[65vh] p-6 overflow-auto">
              {isImageFile(previewFile) ? (
                <img
                  src={`${BASE_URL}${previewFile.file_path}`}
                  alt={previewFile.file_name}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              ) : isVideoFile(previewFile) ? (
                <video
                  src={`${BASE_URL}${previewFile.file_path}`}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-full"
                >
                  <source src={`${BASE_URL}${previewFile.file_path}`} />
                  เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                </video>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้
                  </p>
                  <button
                    onClick={() =>
                      window.open(
                        `${BASE_URL}${previewFile.file_path}`,
                        "_blank",
                      )
                    }
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    ดาวน์โหลดไฟล์
                  </button>
                </div>
              )}
            </div>

            {/* ===== FOOTER ===== */}
            <div className="flex justify-between px-4 py-2 text-sm border-t bg-white">
              <span className="text-green-600">พร้อมใช้งาน</span>
              <span>ประเภทไฟล์: {previewFile.mime_type || "-"}</span>
              <span>
                อัปเดตล่าสุด:{" "}
                {previewFile.created_at
                  ? new Date(previewFile.created_at).toLocaleDateString(
                      "th-TH",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      )}
      <DownloadProgress
        percent={downloadProgress}
        visible={isDownloading}
        fileName={isDownloading ? "กำลังดาวน์โหลด..." : ""}
        fileCount={1}
        onClose={() => {
          setIsDownloading(false);
          setDownloadProgress(0);
        }}
      />
    </DriveLayout>
  );
};

export default AdminDriveUsers;
