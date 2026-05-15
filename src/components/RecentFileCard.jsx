import React from "react";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAudio,
  FaFileAlt,
  FaStar,
} from "react-icons/fa";
import { AiFillPlayCircle } from "react-icons/ai";
import { TbFolderFilled } from "react-icons/tb";
import { FiClock, FiFolder, FiUser, FiCalendar } from "react-icons/fi";
import { BASE_URL } from "../api/api";

export default function RecentFileCard({ item, layout = "list", isSelected = false, onClick }) {

  /* ================= DEBUG LOGS ================= */
  console.log(`--- [DEBUG] File: ${item.file_name || item.name} ---`);
  console.log("1. Raw Time from API:", item.last_opened_at || item.updated_at);
  
  /* ================= DATE LOGIC (UTC -> Thai) ================= */
  const rawTime = item.last_opened_at || item.updated_at || null;
  let dateObj = null;

  if (rawTime) {
    const formattedTime = rawTime.includes('T') || rawTime.includes('Z') 
      ? rawTime 
      : `${rawTime.replace(' ', 'T')}Z`;
    
    dateObj = new Date(formattedTime);
    console.log("2. Formatted for JS:", formattedTime);
    console.log("3. Thai Local Time:", dateObj.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }));
  }

  // แปลงวันที่ (ไทย พ.ศ.)
  const dateStr = dateObj
    ? dateObj.toLocaleDateString("th-TH", {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        timeZone: "Asia/Bangkok"
      })
    : "-";

  // แปลงเวลา (ไทย 24 ชม.)
  const timeStr = dateObj
    ? dateObj.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok"
      })
    : "-";

  /* ================= FILE & USER INFO ================= */
  const fileURL = item.file_url || (item.file_path ? `${BASE_URL}/${item.file_path.replace(/^\/+/, "")}` : null);
  const isImage = item.mime_type?.startsWith("image/");
  const isVideo = item.mime_type?.startsWith("video/");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserName = storedUser.name || "ฉัน";
  const userAvatar = storedUser.avatar_url || storedUser.profile_image;

  const renderIcon = (size = 20) => {
    if (item.isFolder) return <TbFolderFilled className="text-blue-500" size={size} />;
    const type = item.mime_type || "";
    if (type === "application/pdf") return <FaFilePdf className="text-red-500" size={size} />;
    if (type.includes("word")) return <FaFileWord className="text-blue-600" size={size} />;
    if (type.includes("excel") || type.includes("spreadsheet")) return <FaFileExcel className="text-green-600" size={size} />;
    if (type.includes("presentation")) return <FaFilePowerpoint className="text-orange-500" size={size} />;
    if (type.startsWith("audio/")) return <FaFileAudio className="text-purple-500" size={size} />;
    if (type.startsWith("video/")) return <AiFillPlayCircle className="text-indigo-500" size={size} />;
    return <FaFileAlt className="text-gray-500" size={size} />;
  };

  /* ================= RENDER GRID (สำหรับมือถือ) ================= */
  const renderGrid = () => (
    <div
      onClick={onClick}
      className={`relative flex flex-col rounded-2xl sm:rounded-[24px] border transition-all duration-300 group bg-white p-2.5 sm:p-3
        ${isSelected
          ? "border-blue-400 shadow-lg ring-2 ring-blue-400/10 scale-[0.98]"
          : "border-slate-100 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 sm:hover:-translate-y-1 active:scale-95 active:bg-slate-50"
        }`}
    >
      <div className="aspect-square mb-2 sm:mb-3 rounded-xl sm:rounded-[18px] bg-slate-50 flex items-center justify-center relative overflow-hidden shadow-inner">
        {isImage && fileURL ? (
          <img 
            src={fileURL} 
            alt={item.file_name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : isVideo && fileURL ? (
          <div className="relative w-full h-full">
            <video src={fileURL} className="w-full h-full object-cover" muted />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
              <AiFillPlayCircle size={24} className="text-white drop-shadow-md sm:size-8" />
            </div>
          </div>
        ) : (
          <div className="transform group-hover:scale-110 transition-transform duration-500">
            {renderIcon(window.innerWidth < 640 ? 32 : 42)}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 min-w-0 px-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs sm:text-sm font-bold text-slate-800">{item.file_name || item.name}</span>
          {item.favorite && (
            <FaStar 
              size={window.innerWidth < 640 ? 10 : 12} 
              className="text-yellow-400 flex-shrink-0" 
            />
          )}
        </div>
        
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1 truncate">
            <FiFolder size={window.innerWidth < 640 ? 9 : 10} /> 
            <span className="truncate">{item.parent_folder || "ไดรฟ์"}</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase ml-1">
            {item.isFolder ? "" : `${item.size_mb || "0"} MB`}
          </span>
        </div>
        
        <div className="h-px bg-slate-50 my-1 sm:my-1.5" />
        
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
          <div className="flex items-center gap-1 truncate">
            <FiCalendar size={window.innerWidth < 640 ? 9 : 10} className="text-blue-400/70" /> 
            <span className="truncate">{dateStr}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-600 ml-1 whitespace-nowrap">
            <FiClock size={window.innerWidth < 640 ? 9 : 10} /> 
            {timeStr} น.
          </div>
        </div>
      </div>
    </div>
  );

  /* ================= RENDER LIST (สำหรับมือถือ) ================= */
  const renderList = () => (
    <div
      onClick={onClick}
      className={`relative grid grid-cols-12 items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl cursor-pointer bg-white border border-transparent transition-all duration-300 group touch-manipulation
        ${isSelected
          ? "border-blue-400 bg-blue-50/50 shadow-md ring-2 ring-blue-400/10 scale-[0.99]"
          : "hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm active:bg-slate-100 active:scale-[0.995]"
        }`}
    >
      {/* File Icon & Name - col-span responsive */}
      <div className="col-span-7 sm:col-span-4 flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 transform group-hover:scale-105 transition-transform duration-300">
          {isImage && fileURL ? (
            <img src={fileURL} className="w-full h-full object-cover" alt="" />
          ) : isVideo && fileURL ? (
            <div className="relative w-full h-full">
              <video src={fileURL} className="w-full h-full object-cover" muted />
              <AiFillPlayCircle size={12} className="absolute inset-0 m-auto text-white sm:size-4" />
            </div>
          ) : renderIcon(window.innerWidth < 640 ? 18 : 20)}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="truncate text-xs sm:text-sm font-bold text-slate-800">
              {item.file_name || item.name}
            </span>
            {item.favorite && (
              <FaStar 
                size={window.innerWidth < 640 ? 10 : 11} 
                className="text-yellow-400 flex-shrink-0" 
              />
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
            <FiFolder size={window.innerWidth < 640 ? 10 : 12} className="text-slate-300" /> 
            <span className="truncate">{item.parent_folder || "ไดรฟ์ของฉัน"}</span>
          </span>
        </div>
      </div>

      {/* Owner - hidden on mobile, show on sm+ */}
      <div className="hidden sm:flex col-span-3 items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm overflow-hidden flex-shrink-0">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt="owner" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "";
                e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
              }}
            />
          ) : <FiUser size={14} />}
        </div>
        <div className="flex flex-col truncate text-left">
          <span className="text-xs font-bold text-slate-700 truncate">
            {item.owner_name || currentUserName}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-tight">
            Owner
          </span>
        </div>
      </div>

      {/* File Size - responsive sizing */}
      <div className="col-span-2 sm:col-span-2 flex flex-col items-center">
        <span className="text-xs font-bold text-slate-600">
          {item.isFolder ? "-" : `${item.size_mb || "0"}`}
        </span>
        <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-tighter">
          MB
        </span>
      </div>

      {/* Date & Time - responsive layout */}
      <div className="col-span-3 sm:col-span-3 flex flex-col items-end gap-0.5 sm:gap-1">
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-slate-100 rounded-lg text-[10px] sm:text-[11px] font-bold text-slate-600 border border-slate-200/50 whitespace-nowrap">
          <FiCalendar size={window.innerWidth < 640 ? 10 : 12} className="text-slate-400 flex-shrink-0" /> 
          <span className="truncate">{dateStr}</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-slate-400 font-medium mr-0.5 sm:mr-1 whitespace-nowrap">
          <FiClock size={window.innerWidth < 640 ? 10 : 12} className="flex-shrink-0" /> 
          <span>{timeStr} น.</span>
        </div>
      </div>

      {/* Mobile-only owner avatar (small) */}
      <div className="sm:hidden absolute right-2 bottom-2">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm overflow-hidden">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt="owner" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "";
                e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
              }}
            />
          ) : <FiUser size={10} />}
        </div>
      </div>
    </div>
  );

  /* ================= MOBILE-ONLY COMPACT VIEW ================= */
  const renderMobileCompact = () => (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer bg-white border transition-all duration-200 active:scale-[0.995] touch-manipulation
        ${isSelected
          ? "border-blue-400 bg-blue-50/50 shadow-sm ring-1 ring-blue-400/20"
          : "border-slate-100 hover:bg-slate-50"
        }`}
    >
      <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
        {isImage && fileURL ? (
          <img src={fileURL} className="w-full h-full object-cover" alt="" />
        ) : isVideo && fileURL ? (
          <div className="relative w-full h-full">
            <video src={fileURL} className="w-full h-full object-cover" muted />
            <AiFillPlayCircle size={14} className="absolute inset-0 m-auto text-white" />
          </div>
        ) : renderIcon(22)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800 truncate">
            {item.file_name || item.name}
          </span>
          {item.favorite && (
            <FaStar size={12} className="text-yellow-400 ml-1 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <FiFolder size={12} /> 
              <span className="truncate max-w-[100px]">{item.parent_folder || "ไดรฟ์"}</span>
            </span>
            <span className="text-xs font-bold text-slate-600">
              {item.isFolder ? "" : `· ${item.size_mb || "0"} MB`}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap ml-2">
            <FiCalendar size={12} />
            <span>{dateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // เลือก Layout ตามขนาดหน้าจอ
  const isMobile = window.innerWidth < 640;
  
  if (layout === "grid") {
    return renderGrid();
  } else {
    // บนมือถือให้ใช้ compact view, บน desktop ใช้ list view แบบเต็ม
    return isMobile ? renderMobileCompact() : renderList();
  }
}