import React from "react";
import { AiFillPlayCircle } from "react-icons/ai";
import { SiAdobephotoshop } from "react-icons/si";
import { MdDescription, MdMoreVert } from "react-icons/md";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAudio,
  FaFileAlt,
  FaFileArchive,

} from "react-icons/fa";
import { BASE_URL } from "../../api/api";

export default function FileCard({
  file,
  sharedUser,
  layout = "grid",
  onDoubleClick,
  onActionClick,
}) {
  const fileURL =
    file.file_url ||
    (file.file_path
      ? `${BASE_URL}/${file.file_path.replace(/^\/+/, "")}`
      : null);

  const mime = file.mime_type || "";
  const name = (file.file_name || file.name || "").toLowerCase();
  const extension = name.split(".").pop()?.toUpperCase();

  const isText = mime.startsWith("text/") || name.endsWith(".txt");
  const isZip =
    mime.includes("zip") ||
    mime.includes("rar") ||
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z");
  const isPSD =
    mime === "image/vnd.adobe.photoshop" || name.endsWith(".psd");
  const isImage = mime.startsWith("image/") && !isPSD;
  const isVideo = mime.startsWith("video/");
  const isPdf = mime === "application/pdf";

  const renderFileIcon = (size = 48) => {
    if (isPSD) return <SiAdobephotoshop size={size} className="text-blue-600" />;
    if (isPdf) return <FaFilePdf size={size} className="text-red-500" />;
    if (isZip) return <FaFileArchive size={size} className="text-amber-600" />;
    if (isText)
      return <MdDescription size={size} className="text-gray-500" />;
    if (mime.includes("word"))
      return <FaFileWord size={size} className="text-blue-600" />;
    if (mime.includes("excel") || mime.includes("spreadsheet"))
      return <FaFileExcel size={size} className="text-emerald-600" />;
    if (mime.includes("presentation"))
      return <FaFilePowerpoint size={size} className="text-orange-500" />;
    if (mime.startsWith("audio/"))
      return <FaFileAudio size={size} className="text-purple-500" />;
    if (isVideo)
      return <AiFillPlayCircle size={size} className="text-indigo-500" />;

    return <FaFileAlt size={size} className="text-gray-400" />;
  };

  /* ================= GRID ================= */
  const renderGrid = () => (
    <div
      onDoubleClick={onDoubleClick}
      className="
        group relative rounded-2xl bg-white
        border border-gray-100 shadow-sm
        hover:shadow-xl hover:border-sky-200
        transition-all duration-300 cursor-pointer overflow-hidden
      "
    >
      {/* Preview */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center">
        {isImage && fileURL ? (
          <img
            src={fileURL}
            alt={file.file_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : isVideo && fileURL ? (
          <div className="relative w-full h-full">
            <video
              src={fileURL}
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <AiFillPlayCircle size={48} className="text-white" />
            </div>
          </div>
        ) : (
          <div className="group-hover:scale-110 transition-transform duration-300">
            {renderFileIcon(56)}
          </div>
        )}

        {/* Extension Badge */}
        {extension && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/90 rounded text-[10px] font-bold text-gray-600 shadow">
            {extension}
          </div>
        )}

        {/* ===== Bottom Overlay (เหมือน FolderCard) ===== */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
          {/* Filename */}
          <div
            className="text-white text-xs font-semibold truncate drop-shadow"
            title={file.file_name || file.name}
          >
            {file.file_name || file.name}
          </div>

          {/* Shared User */}
          {sharedUser && (
            <div className="mt-1 flex items-center gap-2 text-white/90 text-[11px]">
              <img
                src={sharedUser.avatar || "/default-avatar.png"}
                className="w-4 h-4 rounded-full border border-white/60"
              />
              <span className="truncate italic">
                โดย {sharedUser.username}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info (ด้านล่าง) */}
      <div className="p-3">
        <div className="flex justify-between text-[11px] text-gray-400">
          <span>{file.size_mb || 0} MB</span>

          <span>
            {file.created_at
              ? new Date(file.created_at).toLocaleString("th-TH", {
                timeZone: "Asia/Bangkok",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
              : "-"}
          </span>
        </div>
      </div>


    </div>
  );

  /* ================= LIST ================= */
  const renderList = () => (
    <div
      onDoubleClick={onDoubleClick}
      className="
        flex items-center gap-4 px-4 py-3
        rounded-xl hover:bg-sky-50 transition cursor-pointer
      "
    >
      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
        {isImage && fileURL ? (
          <img
            src={fileURL}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          renderFileIcon(22)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">
          {file.file_name || file.name}
        </div>
        <div className="text-xs text-gray-400">
          {extension} • {file.size_mb || 0} MB •{" "}
          {file.updated_at?.slice(0, 10)}
        </div>
      </div>

      {sharedUser && (
        <div className="hidden sm:flex items-center gap-2">
          <img
            src={sharedUser.avatar || "/default-avatar.png"}
            className="w-5 h-5 rounded-full"
          />
          <span className="text-xs text-gray-500 truncate max-w-[80px]">
            {sharedUser.username}
          </span>
        </div>
      )}
    </div>
  );

  return layout === "list" ? renderList() : renderGrid();
}
