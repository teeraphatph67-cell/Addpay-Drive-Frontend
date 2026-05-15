import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import AddIcon from "@mui/icons-material/Add";
import { API_BASE } from "../api/api.js";
import UploadProgress from "./UploadProgress";
import { FiUpload, FiFolderPlus, FiX } from "react-icons/fi";

const UploadButton = forwardRef(
  ({ parentId, onUploadClick, onCreateFolder, iconOnly = false, className = "", children }, ref) => {
    const [open, setOpen] = useState(false);
    const [showFolderPopup, setShowFolderPopup] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isMobile, setIsMobile] = useState(false);
    const [inputKey, setInputKey] = useState(0); // เพิ่ม key สำหรับ file input

    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const actionSheetRef = useRef(null);

    // เก็บ xhr ของแต่ละไฟล์
    const xhrMapRef = useRef({});

    // ตรวจสอบว่าเป็นมือถือหรือไม่
    useEffect(() => {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
      
      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      handleUploadFiles,
      setDragActive,
      get dragActive() {
        return dragActive;
      },
    }));

    const setErr = (msg) => {
      setErrorMessage(msg);
      setShowError(true);
    };

    /* ===============================
       Upload files
    =============================== */
    const handleUploadFiles = async (files) => {
      const token = localStorage.getItem("api_token");
      if (!token) return setErr("Token ไม่ถูกต้อง กรุณา login ใหม่");

      const newProgress = { ...uploadProgress };

      for (const file of files) {
        newProgress[file.name] = { percent: 0 };
        setUploadProgress({ ...newProgress });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder_id", parentId ?? "");

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrMapRef.current[file.name] = xhr;

          xhr.open("POST", `${API_BASE}/Upload`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              newProgress[file.name].percent = percent;
              setUploadProgress({ ...newProgress });
            }
          };

          xhr.onload = () => {
            delete xhrMapRef.current[file.name];

            if (xhr.status >= 200 && xhr.status < 300) {
              newProgress[file.name].percent = 100;
              setUploadProgress({ ...newProgress });
              onUploadClick?.();
              resolve();
            } else {
              reject("Upload failed");
            }
          };

          xhr.onerror = () => {
            delete xhrMapRef.current[file.name];
            reject("Upload error");
          };

          xhr.onabort = () => {
            delete xhrMapRef.current[file.name];
            resolve();
          };

          xhr.send(formData);
        }).catch((err) => setErr(err));
      }
    };

    /* ===============================
       Cancel upload
    =============================== */
    const cancelUpload = (fileName) => {
      const xhr = xhrMapRef.current[fileName];
      if (xhr) xhr.abort();

      setUploadProgress((prev) => {
        const copy = { ...prev };
        delete copy[fileName];
        return copy;
      });
    };

    const handleFileSelect = (e) => {
      console.log("File selected:", e.target.files);
      if (e.target.files && e.target.files.length > 0) {
        handleUploadFiles(e.target.files);
        // Reset input value เพื่อให้เลือกไฟล์เดิมได้อีกครั้ง
        e.target.value = '';
      }
    };

    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (["dragenter", "dragover"].includes(e.type)) setDragActive(true);
      else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        handleUploadFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    };

    // ปิดเมนูเมื่อคลิกที่อื่น (เฉพาะ Desktop)
    useEffect(() => {
      const handleClickOutside = (e) => {
        // สำหรับ desktop dropdown เท่านั้น
        if (!isMobile && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isMobile]);

    // ฟังก์ชันสำหรับเปิด file picker - แก้ไขใหม่
    const triggerFileInput = () => {
      console.log("Triggering file input...");
      
      // ปิดเมนูก่อน
      setOpen(false);
      
      // เปลี่ยน key เพื่อบังคับให้ React สร้าง input ใหม่
      setInputKey(prev => prev + 1);
      
      // รอให้ React re-render แล้วค่อยเปิด file picker
      setTimeout(() => {
        if (inputRef.current) {
          console.log("Clicking file input element...");
          inputRef.current.click();
        }
      }, 100);
    };

    // Component สำหรับปุ่มหลัก
    const MainButton = () => {
      if (iconOnly) {
        return (
          <button
            onClick={() => setOpen(!open)}
            className={className}
          >
            {children || <FiUpload size={24} />}
          </button>
        );
      }

      return (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md"
        >
          <AddIcon className="mr-2" /> ใหม่
        </button>
      );
    };

    // Component สำหรับ Desktop Dropdown Menu
    const DesktopDropdownMenu = () => (
      <div className="absolute mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
        <button
          className="px-4 py-3 w-full text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          onClick={() => {
            setOpen(false);
            setTimeout(() => {
              setShowFolderPopup(true);
            }, 10);
          }}
        >
          <FiFolderPlus size={18} />
          <span>โฟลเดอร์ใหม่</span>
        </button>

        <button
          className="px-4 py-3 w-full text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          onClick={triggerFileInput}
        >
          <FiUpload size={18} />
          <span>อัปโหลดไฟล์</span>
        </button>
      </div>
    );

    // Component สำหรับ Mobile Action Sheet
    const MobileActionSheet = () => {
      const handleClose = () => {
        setOpen(false);
      };

      const handleCreateFolder = () => {
        setOpen(false);
        setTimeout(() => {
          setShowFolderPopup(true);
        }, 100);
      };

      const handleUploadClick = () => {
        triggerFileInput();
      };

      return createPortal(
        <div 
          className="fixed inset-0 z-[99999]"
          onClick={(e) => {
            // ปิดเฉพาะเมื่อคลิกที่ overlay เท่านั้น
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Action Sheet */}
          <div 
            ref={actionSheetRef}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl md:rounded-2xl w-full md:w-[400px] md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto max-h-[70vh] md:max-h-[80vh] flex flex-col animate-slide-up md:animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-800">ตัวเลือกการสร้าง</h3>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Options */}
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={handleCreateFolder}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-blue-50 rounded-xl active:scale-[0.98] transition-all mb-3"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiFolderPlus size={24} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800">สร้างโฟลเดอร์ใหม่</div>
                  <div className="text-sm text-slate-500 truncate">สร้างโฟลเดอร์สำหรับจัดเก็บไฟล์</div>
                </div>
              </button>

              <button
                onClick={handleUploadClick}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-green-50 rounded-xl active:scale-[0.98] transition-all"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiUpload size={24} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800">อัปโหลดไฟล์</div>
                  <div className="text-sm text-slate-500 truncate">อัปโหลดไฟล์จากอุปกรณ์ของคุณ</div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleClose}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-slate-700 font-bold rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>,
        document.body
      );
    };

    // Helper function สำหรับสร้างโฟลเดอร์
    const handleCreateFolderAction = async () => {
      if (!folderName.trim()) {
        setErr("กรุณากรอกชื่อโฟลเดอร์");
        return;
      }

      try {
        await onCreateFolder?.(folderName);
        setFolderName("");
        setShowFolderPopup(false);
      } catch (error) {
        setErr(error.message || "เกิดข้อผิดพลาดในการสร้างโฟลเดอร์");
      }
    };

    return (
      <div
        className="relative"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {/* Dropdown Button (Desktop) หรือ Icon Button (Mobile) */}
        <div className="relative" ref={dropdownRef}>
          <MainButton />
          
          {/* Desktop Dropdown Menu */}
          {!isMobile && open && <DesktopDropdownMenu />}
        </div>

        {/* Mobile Action Sheet */}
        {isMobile && open && <MobileActionSheet />}

        {/* File Input ที่สำคัญ - อยู่นอก conditional rendering */}
        <input
          key={`file-input-${inputKey}`}
          type="file"
          ref={inputRef}
          multiple
          className="hidden"
          onChange={handleFileSelect}
          onClick={(e) => {
            console.log("File input clicked");
            e.stopPropagation();
          }}
        />

        <UploadProgress
          progress={uploadProgress}
          onCancel={cancelUpload}
        />

        {/* ===============================
           Create Folder Popup (Portal)
        =============================== */}
        {showFolderPopup &&
          createPortal(
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    สร้างโฟลเดอร์ใหม่
                  </h3>
                  <button
                    onClick={() => {
                      setShowFolderPopup(false);
                      setFolderName("");
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ชื่อโฟลเดอร์
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="กรอกชื่อโฟลเดอร์"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && folderName.trim()) {
                        e.preventDefault();
                        handleCreateFolderAction();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-colors"
                    onClick={() => {
                      setShowFolderPopup(false);
                      setFolderName("");
                    }}
                  >
                    ยกเลิก
                  </button>

                  <button
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCreateFolderAction}
                    disabled={!folderName.trim()}
                  >
                    สร้าง
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Error Modal */}
        {showError &&
          createPortal(
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-[320px] border border-red-100 shadow-xl text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-red-600 text-2xl">❌</div>
                </div>
                <h3 className="font-bold text-slate-800 mb-2">เกิดข้อผิดพลาด</h3>
                <p className="text-slate-600 mb-6">{errorMessage}</p>
                <button
                  className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                  onClick={() => setShowError(false)}
                >
                  ตกลง
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }
);

export default UploadButton;