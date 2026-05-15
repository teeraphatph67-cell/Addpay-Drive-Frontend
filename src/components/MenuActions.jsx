import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BASE_URL } from "../api/api";
import {
  FiEdit,
  FiTrash2,
  FiDownload,
  FiEye,
  FiRotateCcw,
  FiStar,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { HiOutlineLink } from "react-icons/hi";
import ShareModal from "./ShareModal";

const MOBILE_BREAKPOINT = 768;

export default function MenuActions({
  item,
  handlers = {},
  isTrash = false,
  favorite = false,
  view = "user",
}) {
  const [open, setOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const token = localStorage.getItem("api_token");

  // ตรวจสอบว่าเป็นมือถือหรือไม่
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("close-all-menus", close);
    return () => window.removeEventListener("close-all-menus", close);
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    e.preventDefault();

    window.dispatchEvent(new CustomEvent("close-all-menus"));
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  /* ================= Actions ================= */
  const handleFavorite = (e) => {
    e?.stopPropagation();
    handlers.onFavorite?.(item.id, !favorite, item.isFolder);
    closeMenu();
  };

  // ในส่วน Actions ให้แก้ไข handleDownload
const handleDownload = async (e) => {
  e?.stopPropagation();
  
  // ✅ เรียก onDownload โดยส่ง item ปัจจุบันเป็น array
  if (handlers.onDownload) {
    // ส่ง item ปัจจุบันไปในรูปแบบ array (เพื่อให้ตรงกับที่ handleDownload คาดหวัง)
    await handlers.onDownload([item]);
  } else {
    // fallback เดิม
    try {
      let url = "";
      let method = "GET";
      let body = null;
      let filename = item.file_name || item.name || "download";
      const isFolderRequest = item.isFolder || item.isUser;

      if (view === "admin") {
        if (isFolderRequest) {
          url = `${BASE_URL}api/v1/download/multiple`; 
          method = "POST";
          body = JSON.stringify({
            items: [{ id: item.id, type: "folder" }],
          });
        } else {
          url = `${BASE_URL}api/v1/admin/files/${item.id}/download`;
          method = "GET";
        }
      } else {
        if (!isFolderRequest) {
          url = `${BASE_URL}api/v1/download/file/${item.id}`;
          method = "GET";
        } else {
          url = `${BASE_URL}api/v1/download/multiple`;
          method = "POST";
          body = JSON.stringify({
            items: [{ id: item.id, type: "folder" }],
          });
        }
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      });

      if (!response.ok) {
        throw new Error(`ดาวน์โหลดไม่สำเร็จ (${response.status})`);
      }

      const blob = await response.blob();
      const finalFilename = isFolderRequest && !filename.toLowerCase().endsWith(".zip")
        ? `${filename}.zip`
        : filename;

      downloadBlob(blob, finalFilename);
    } catch (error) {
      console.error("Download error:", error);
      alert("❌ " + error.message);
    }
  }
  
  closeMenu();
};

  const downloadBlob = (blob, filename) => {
    // สร้าง URL จาก Blob
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.style.display = "none"; // ซ่อน Element
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    // ให้เวลา Browser ทำงานเล็กน้อยก่อนลบ
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/share/${item.id}`,
    );
    alert("✅ คัดลอกลิงก์แล้ว");
    closeMenu();
  };

  const handleActionClick = (handler) => (e) => {
    e?.stopPropagation();
    // ตรวจสอบว่ามี handler ส่งมาจริงไหมก่อนเรียก
    if (handler) {
      handler();
    }
    closeMenu();
  };
  // Desktop Menu - Overlay Style
  const DesktopMenu = () => (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-transparent"
        onClick={closeMenu}
      />

      {/* Menu positioned relative to button */}
      <div
        ref={menuRef}
        className="fixed bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-[9999] w-56"
        onClick={(e) => e.stopPropagation()}
        style={{
          left: btnRef.current
            ? `${Math.min(
                btnRef.current.getBoundingClientRect().left,
                window.innerWidth - 224 - 16,
              )}px`
            : "16px",
          top: btnRef.current
            ? `${btnRef.current.getBoundingClientRect().bottom + 8}px`
            : "16px",
        }}
      >
        {view === "admin" ? (
          <>
            <MenuItem
              icon={<FiDownload className="text-indigo-500" />}
              label="ดาวน์โหลด"
              
              onClick={handleDownload}
              
            />
            <MenuItem
              icon={<FiTrash2 className="text-rose-500" />}
              label="ลบ"
              danger
              onClick={handleActionClick(() => handlers.onDelete?.(item))}
            />
          </>
        ) : isTrash ? (
          <>
            <MenuItem
              icon={<FiRotateCcw className="text-emerald-500" />}
              label="กู้คืนรายการ"
              onClick={handleActionClick(() => handlers.onRestore?.(item))}
            />
            <div className="my-1 border-t border-gray-100" />
            <MenuItem
              icon={<FiTrash2 className="text-rose-500" />}
              label="ลบถาวร"
              danger
              onClick={handleActionClick(() => handlers.onDelete?.(item))}
            />
          </>
        ) : (
          <>
            {!item.isFolder && (
              <MenuItem
                icon={<FiEye className="text-blue-500" />}
                label="เปิดดู"
                onClick={handleActionClick(() => handlers.onPreview?.(item))}
              />
            )}
            <MenuItem
              icon={<FiDownload className="text-indigo-500" />}
              label="ดาวน์โหลด"
              onClick={handleDownload}
            />
            <MenuItem
              icon={<FiUserPlus className="text-violet-500" />}
              label="แชร์"
              primary
              onClick={handleActionClick(() => setShowShareModal(true))}
            />
            <MenuItem
              icon={<HiOutlineLink className="text-gray-500" />}
              label="คัดลอกลิงก์"
              onClick={handleCopyLink}
            />

            <div className="my-1 border-t border-gray-100" />

            <MenuItem
              icon={
                <FiStar
                  className={
                    favorite ? "text-amber-500 fill-amber-500" : "text-gray-400"
                  }
                />
              }
              label={favorite ? "ลบออกจากรายการติดดาว" : "ติดดาว"}
              onClick={handleFavorite}
            />
            <MenuItem
              icon={<FiEdit className="text-gray-500" />}
              label="เปลี่ยนชื่อ"
              onClick={handleActionClick(() => handlers.onRename?.(item))}
            />

            <div className="my-1 border-t border-gray-100" />

            <MenuItem
              icon={<FiTrash2 className="text-rose-500" />}
              label="ย้ายไปถังขยะ"
              danger
              onClick={handleActionClick(() => handlers.onDelete?.(item))}
            />
          </>
        )}
      </div>
    </>
  );

  // Mobile Bottom Sheet - Full Overlay
  const MobileMenu = () => (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={closeMenu}
      />

      {/* Bottom Sheet */}
      <div
        ref={menuRef}
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-slate-800">ตัวเลือก</h3>
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="ปิด"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-2">
          {view === "admin" ? (
            <div className="space-y-1">
              <MobileMenuItem
                icon={<FiDownload className="text-indigo-500" size={22} />}
                label="ดาวน์โหลด"
                subtitle="ดาวน์โหลดไปยังอุปกรณ์"
                onClick={handleDownload}
              />
              <MobileMenuItem
                icon={<FiTrash2 className="text-rose-500" size={22} />}
                label="ลบ"
                subtitle="ลบรายการนี้"
                danger
                onClick={handleActionClick(() => handlers.onDelete?.(item))}
              />
            </div>
          ) : isTrash ? (
            <div className="space-y-1">
              <MobileMenuItem
                icon={<FiRotateCcw className="text-emerald-500" size={22} />}
                label="กู้คืนรายการ"
                subtitle="ย้ายกลับไปยังไดรฟ์"
                onClick={handleActionClick(() => handlers.onRestore?.(item))}
              />
              <MobileMenuItem
                icon={<FiTrash2 className="text-rose-500" size={22} />}
                label="ลบถาวร"
                subtitle="ลบรายการนี้ถาวร"
                danger
                onClick={handleActionClick(() => handlers.onDelete?.(item))}
              />
            </div>
          ) : (
            <div className="space-y-1">
              {!item.isFolder && (
                <MobileMenuItem
                  icon={<FiEye className="text-blue-500" size={22} />}
                  label="เปิดดู"
                  subtitle="เปิดไฟล์นี้"
                  onClick={handleActionClick(() => handlers.onPreview?.(item))}
                />
              )}

              <MobileMenuItem
                icon={<FiDownload className="text-indigo-500" size={22} />}
                label="ดาวน์โหลด"
                subtitle="ดาวน์โหลดไปยังอุปกรณ์"
                onClick={handleDownload}
              />

              <MobileMenuItem
                icon={<FiUserPlus className="text-violet-500" size={22} />}
                label="แชร์"
                subtitle="แชร์กับผู้อื่น"
                primary
                onClick={handleActionClick(() => setShowShareModal(true))}
              />

              <MobileMenuItem
                icon={<HiOutlineLink className="text-gray-500" size={22} />}
                label="คัดลอกลิงก์"
                subtitle="คัดลอกลิงก์แชร์"
                onClick={handleCopyLink}
              />

              <div className="h-px bg-gray-100 my-3 mx-4" />

              <MobileMenuItem
                icon={
                  <FiStar
                    className={
                      favorite
                        ? "text-amber-500 fill-amber-500"
                        : "text-gray-400"
                    }
                    size={22}
                  />
                }
                label={favorite ? "ลบออกจากติดดาว" : "ติดดาว"}
                subtitle={
                  favorite ? "ลบออกจากรายการติดดาว" : "เพิ่มในรายการติดดาว"
                }
                onClick={handleFavorite}
              />

              <MobileMenuItem
                icon={<FiEdit className="text-gray-500" size={22} />}
                label="เปลี่ยนชื่อ"
                subtitle="แก้ไขชื่อรายการนี้"
                onClick={handleActionClick(() => handlers.onRename?.(item))}
              />

              <div className="h-px bg-gray-100 my-3 mx-4" />

              <MobileMenuItem
                icon={<FiTrash2 className="text-rose-500" size={22} />}
                label="ย้ายไปถังขยะ"
                subtitle="ลบรายการนี้"
                danger
                onClick={handleActionClick(() => handlers.onDelete?.(item))}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={closeMenu}
            className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-slate-700 font-bold rounded-xl transition-colors text-center"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition-colors ${
          open ? "bg-gray-100" : "hover:bg-gray-100"
        }`}
        aria-label="เปิดเมนูตัวเลือก"
        aria-expanded={open}
      >
        <BsThreeDotsVertical size={18} className="text-gray-600" />
      </button>

      {open &&
        createPortal(
          isMobile ? <MobileMenu /> : <DesktopMenu />,
          document.body,
        )}

      <ShareModal
        show={showShareModal}
        file={item}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}

// Desktop Menu Item
function MenuItem({ icon, label, onClick, danger, primary }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
        hover:bg-gray-50
        ${danger ? "text-rose-600 hover:bg-rose-50" : ""}
        ${primary ? "text-blue-600 hover:bg-blue-50" : ""}
        ${!danger && !primary ? "text-gray-700 hover:bg-gray-50" : ""}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

// Mobile Menu Item
function MobileMenuItem({ icon, label, subtitle, onClick, danger, primary }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-4 text-left transition-colors active:bg-gray-50
        ${danger ? "text-rose-600" : ""}
        ${primary ? "text-blue-600" : ""}
        ${!danger && !primary ? "text-gray-800" : ""}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base">{label}</div>
        {subtitle && (
          <div
            className={`text-sm ${danger ? "text-rose-500" : primary ? "text-blue-500" : "text-gray-500"}`}
          >
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
}
