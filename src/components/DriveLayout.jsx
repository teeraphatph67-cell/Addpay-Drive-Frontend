import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  
  FiUser,
  FiHardDrive,
  FiUsers,
  FiClock,
  FiStar,
  FiTrash2,
  FiCloud,
  FiLogOut,
  FiChevronDown,
  FiUpload,
  FiMoreVertical,
} from "react-icons/fi";
import { TbUserEdit } from "react-icons/tb";
import { GrUserAdmin } from "react-icons/gr";
import { FaRegHardDrive } from "react-icons/fa6";
import UploadButton from "../components/UploadButton";
import { API_BASE } from "../api/api.js";

export default function DriveLayout({
  children,
  uploadButtonRef,
  currentFolderId,
  onUploadClick,
  onCreateFolder,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const profileDropdownRef = useRef(null);
  const moreMenuRef = useRef(null);

  // ดึงข้อมูล User จาก LocalStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userName = user?.name || "ผู้ใช้งาน";
  const profileImage = user?.avatar_url
    ? user.avatar_url.startsWith("http")
      ? user.avatar_url
      : `${API_BASE.replace("/api/v1", "")}${user.avatar_url}`
    : null;

  // ฟังก์ชัน Logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("api_token");

      if (!token) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Logout Success:", result.message);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  // ปิด Dropdown ทั้งสองเมื่อคลิกที่อื่น
  useEffect(() => {
    const handleClickOutside = (event) => {
      // ปิด Profile Dropdown
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }

      // ปิด More Menu
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // ปิด More Menu เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  const isReadOnly = location.pathname.startsWith("/trash");
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-600 pb-16 md:pb-0">
      {/* ================= NAVBAR ================= */}
      <header className="w-full h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 lg:px-10 sticky top-0 z-50 shadow-sm">
        {/* Left Section - สำหรับ Desktop Only */}
        <div className="flex items-center gap-2 md:gap-4">
          <span className="hidden md:inline text-lg md:text-xl font-black text-slate-800 tracking-tight whitespace-nowrap">
            Addpay<span className="text-blue-500">Drive</span>
          </span>
        </div>

        {/* Center Section - สำหรับมือถือ (Logo + ชื่อตรงกลาง) */}
        <div className="md:hidden flex items-center justify-center flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
              <FiCloud className="text-white text-lg" />
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight whitespace-nowrap">
              Addpay<span className="text-blue-500">Drive</span>
            </span>
          </div>
        </div>

        {/* Right Section - User Profile */}
        <div className="relative" ref={profileDropdownRef}>
          {/* Mobile Profile Button (Icon only) */}
          <button
            onClick={() => {
              setIsProfileDropdownOpen(!isProfileDropdownOpen);
              setIsMoreMenuOpen(false);
            }}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            aria-label="เปิดเมนูโปรไฟล์"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center">
              {profileImage && !avatarError ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    console.error("Avatar load failed:", e.currentTarget.src);
                    setAvatarError(true);
                  }}
                />
              ) : (
                <FiUser size={14} className="text-slate-400" />
              )}
            </div>
          </button>

          {/* Desktop Profile Button (Full) */}
          <button
            onClick={() => {
              setIsProfileDropdownOpen(!isProfileDropdownOpen);
              setIsMoreMenuOpen(false);
            }}
            className="hidden md:flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 rounded-full border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            aria-label="เปิดเมนูโปรไฟล์"
          >
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Authenticated
              </p>
              <p className="text-sm font-bold text-slate-700 leading-tight">
                {userName}
              </p>
            </div>

            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden shadow-inner">
              {profileImage && !avatarError ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <FiUser size={16} className="text-slate-500" />
              )}
            </div>
            <FiChevronDown
              className={`text-gray-400 transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* DROPDOWN MENU */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 md:mt-3 w-56 md:w-60 bg-white rounded-xl md:rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in duration-150">
              {/* User Info Section */}
              <div className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-gray-50 mb-1 md:hidden">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden shadow-inner">
                  {profileImage && !avatarError ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <FiUser size={16} className="text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="hidden md:block px-4 md:px-5 py-3 border-b border-gray-50 mb-1">
                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Account
                </p>
                <p className="text-sm font-bold text-slate-700 truncate">
                  {user?.email}
                </p>
              </div>

              <div className="h-px bg-gray-50 my-2 mx-3"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 md:px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
              >
                <FiLogOut size={16} />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* ================= DESKTOP SIDEBAR ================= */}
        <aside className="hidden md:flex w-64 lg:w-72 bg-white flex-col p-6 lg:p-8 border-r border-gray-50 sticky top-16 md:top-20 h-[calc(100vh-64px)] md:h-[calc(100vh-80px)]">
          <div className="mb-8 lg:mb-10">
            {!isReadOnly ? (
              <UploadButton
                ref={uploadButtonRef}
                parentId={currentFolderId}
                onUploadClick={onUploadClick}
                onCreateFolder={onCreateFolder}
                className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white !py-3 lg:!py-4 !rounded-xl lg:!rounded-2xl !shadow-lg !shadow-blue-100 active:scale-[0.98] !flex !items-center !justify-center !gap-3 !font-bold !border-none"
              />
            ) : (
              <div className="h-12 lg:h-14 flex items-center justify-center text-gray-400 text-xs font-bold bg-gray-50 rounded-xl lg:rounded-2xl border border-dashed border-gray-200">
                READ ONLY MODE
              </div>
            )}
          </div>

          <nav className="flex flex-col gap-1">
            
            <NavItem
              to="/mydrive"
              icon={<FiHardDrive size={18} />}
              label="ไดรฟ์ของฉัน"
              active={isActive("/mydrive")}
            />
            {user?.status === "admin" && (
              <>
                <NavItem
                  to="/driveuser"
                  icon={<FaRegHardDrive  size={18} />}
                  label="ไดรฟ์ของผู้ใช้ทั้งหมด"
                  active={isActive("/driveuser")}
                />

                <NavItem
                  to="/ListUser"
                  icon={<TbUserEdit  size={18} />}
                  label="รายชื่อผู้ใช้ทั้งหมดในระบบ"
                  active={isActive("/ListUser")}
                />
              </>
            )}

            <NavItem
              to="/shared-v2"
              icon={<FiUsers size={18} />}
              label="แชร์กับฉัน"
              active={isActive("/shared-v2")}
            />
            <NavItem
              to="/recent"
              icon={<FiClock size={18} />}
              label="ล่าสุด"
              active={isActive("/recent")}
            />
            <NavItem
              to="/starred"
              icon={<FiStar size={18} />}
              label="ที่ติดดาว"
              active={isActive("/starred")}
              activeColor="text-amber-500 bg-amber-50/60"
            />
            <div className="my-4 lg:my-6 border-t border-gray-50 mx-4" />
            <NavItem
              to="/trash"
              icon={<FiTrash2 size={18} />}
              label="ถังขยะ"
              active={isActive("/trash")}
              activeColor="text-rose-500 bg-rose-50/60"
            />
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 w-full md:w-[calc(100%-256px)] lg:w-[calc(100%-288px)]">
          <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-6">{children}</div>
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-16 relative">
          {/* ไดรฟ์ของฉัน */}
          <MobileNavItem
            to="/mydrive"
            icon={<FiHardDrive size={22} />}
            label="ไดรฟ์"
            active={isActive("/mydrive")}
          />

          {/* แชร์กับฉัน */}
          <MobileNavItem
            to="/shared-v2"
            icon={<FiUsers size={22} />}
            label="แชร์"
            active={isActive("/shared-v2")}
          />

          {/* Upload Button Center */}
          <div className="relative -mt-8">
            {!isReadOnly ? (
              <UploadButton
                ref={uploadButtonRef}
                parentId={currentFolderId}
                onUploadClick={onUploadClick}
                onCreateFolder={onCreateFolder}
                className="!w-16 !h-16 !bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 !text-white !rounded-full !shadow-xl !shadow-blue-200/50 active:scale-95 !flex !items-center !justify-center !border-2 !border-white"
                iconOnly={true}
              >
                <FiUpload size={24} />
              </UploadButton>
            ) : (
              <div className="w-16 h-16 flex items-center justify-center text-gray-400 bg-gray-100 rounded-full border-2 border-white shadow-xl">
                <FiUpload size={24} />
              </div>
            )}
          </div>

          {/* ล่าสุด */}
          <MobileNavItem
            to="/recent"
            icon={<FiClock size={22} />}
            label="ล่าสุด"
            active={isActive("/recent")}
          />

          {/* ปุ่มเพิ่มเติม */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => {
                setIsMoreMenuOpen(!isMoreMenuOpen);
                setIsProfileDropdownOpen(false); // ปิดโปรไฟล์ถ้าเปิดอยู่
              }}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${isMoreMenuOpen ? "text-blue-500 bg-blue-50" : "text-slate-400 hover:text-blue-500"}`}
            >
              <div className="relative">
                <FiMoreVertical size={22} />
                {isMoreMenuOpen && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                )}
              </div>
              <span className="text-[10px] font-bold mt-1">เพิ่มเติม</span>
            </button>

            {/* More Menu Popup */}
            {isMoreMenuOpen && (
              <div className="absolute bottom-16 right-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Account
                  </p>
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {user?.email || user?.email}
                  </p>
                </div>

                <MobileNavPopupItem
                  to="/starred"
                  icon={<FiStar size={18} />}
                  label="ที่ติดดาว"
                  active={isActive("/starred")}
                  onClick={() => setIsMoreMenuOpen(false)}
                />
                <MobileNavPopupItem
                  to="/trash"
                  icon={<FiTrash2 size={18} />}
                  label="ถังขยะ"
                  active={isActive("/trash")}
                  onClick={() => setIsMoreMenuOpen(false)}
                />
                {user?.status === "admin" && (
                  <>
                    <MobileNavPopupItem
                      to="/driveuser"
                      icon={<FaRegHardDrive  size={18} />}
                      label="ไดรฟ์ของผู้ใช้ทั้งหมด"
                      active={isActive("/driveuser")}
                    />

                    <MobileNavPopupItem
                      to="/ListUser"
                      icon={<TbUserEdit  size={18} />}
                      label="รายชื่อผู้ใช้ทั้งหมดในระบบ"
                      active={isActive("/ListUser")}
                    />
                  </>
                )}
                <div className="h-px bg-gray-100 my-2 mx-3"></div>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                >
                  <FiLogOut size={18} />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  active,
  activeColor = "text-blue-600 bg-blue-50/60",
}) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between px-4 py-3 rounded-xl lg:rounded-2xl transition-all font-bold text-sm ${
        active
          ? activeColor
          : "text-slate-400 hover:text-slate-700 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3 lg:gap-4">
        {icon}
        <span>{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
    </Link>
  );
}

function MobileNavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${active ? "text-blue-500 bg-blue-50" : "text-slate-400 hover:text-blue-500"}`}
    >
      <div className="relative">
        {icon}
        {active && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        )}
      </div>
      <span className="text-[10px] font-bold mt-1">{label}</span>
    </Link>
  );
}

function MobileNavPopupItem({ to, icon, label, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors ${active ? "text-blue-500 bg-blue-50" : "text-slate-600 hover:bg-gray-50"}`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>
      )}
    </Link>
  );
}
