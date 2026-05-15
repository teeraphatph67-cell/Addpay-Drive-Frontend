import React from "react";
import { TbFolderFilled, TbDotsVertical } from "react-icons/tb";
import {
  FiEye,
  FiEdit2,
  FiDownload,
  FiLock,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

export default function FolderCard({
  folder,
  sharedUser,
  isSelected = false,
  onActionClick,
}) {
  const displayName = folder.name || "Untitled";

  const canEdit = folder.allow_edit;
  const canView = folder.allow_view;
  const canDownload = folder.allow_download;

  const createdDate = folder.created_at
    ? new Date(folder.created_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

  // ✅ fallback user
  const username = sharedUser?.username || "ไม่ทราบผู้ใช้";
  const avatar =
    sharedUser?.avatar && sharedUser.avatar !== ""
      ? sharedUser.avatar
      : null;


  return (
    <div
      className={`
        relative group flex flex-col h-full rounded-2xl p-4
        transition-all duration-300 ease-out cursor-pointer select-none
        border-2
        ${
          isSelected
            ? "bg-sky-50/50 border-sky-400 shadow-lg shadow-sky-100"
            : "bg-white border-transparent shadow-sm hover:shadow-xl hover:border-gray-100 hover:-translate-y-1"
        }
      `}
    >
      {/* Main Content */}
      <div className="flex flex-col items-center flex-1 py-2">
        <div className="relative">
          <TbFolderFilled
            size={72}
            className={`transition-colors duration-300 ${
              isSelected
                ? "text-sky-500"
                : "text-amber-400 group-hover:text-amber-500"
            }`}
          />
          {!canEdit && (
            <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-sm border border-gray-100">
              <FiLock size={10} className="text-gray-400" />
            </div>
          )}
        </div>

        <h3
          className="mt-3 text-sm font-semibold text-gray-700 text-center w-full line-clamp-1 px-2"
          title={displayName}
        >
          {displayName}
        </h3>

        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
          <FiCalendar />
          <span>{createdDate}</span>
        </div>
      </div>

      <div className="my-3 border-t border-gray-50" />

      <div className="space-y-3">
        {/* Permission badges */}
        <div className="flex flex-wrap gap-1">
          {canEdit ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold">
              <FiEdit2 className="mr-1" /> แก้ไขได้
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 text-[9px] font-bold">
              <FiEye className="mr-1" /> อ่านอย่างเดียว
            </span>
          )}
          {canDownload && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold">
              <FiDownload className="mr-1" /> โหลดได้
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={username}
                  className="w-5 h-5 rounded-full ring-2 ring-white object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-white">
                  <FiUser size={10} className="text-gray-500" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 border-2 border-white rounded-full" />
            </div>

            <span className="text-[11px] font-medium text-gray-600 truncate max-w-[80px]">
              {username}
            </span>
          </div>

          <span className="text-[9px] text-gray-400 italic">
            เจ้าของ
          </span>
        </div>
      </div>
    </div>
  );
}
