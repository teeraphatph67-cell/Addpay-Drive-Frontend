import React, { useState, useEffect, useRef } from "react";
import { TbFolderFilled } from "react-icons/tb";
import { FaStar } from "react-icons/fa";
import { BASE_URL, API_BASE } from "../api/api.js";
import MenuActions from "./MenuActions";
import { AiFillPlayCircle } from "react-icons/ai";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAudio,
  FaFileAlt,
} from "react-icons/fa";

export default function FileCard({
  item,
  layout = "grid",
  handlers = {},
  isTrash = false,
  isSelected = false,
}) {
  const [favorite, setFavorite] = useState(
    item.favorite === 1 || item.favorite === true,
  );

  const clickTimeout = useRef(null);
  const DOUBLE_CLICK_DELAY = 250;
  const fileName = item.file_name || item.name || "";
  const ext = fileName.split(".").pop()?.toLowerCase();

  const isImage =
    item.mime_type?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);

  const isVideo =
    item.mime_type?.startsWith("video/") ||
    ["mp4", "mov", "avi", "mkv"].includes(ext);
  /* ---------- sync favorite ---------- */
  useEffect(() => {
    setFavorite(item.favorite === 1 || item.favorite === true);
  }, [item.favorite]);

  /* ---------- favorite handler ---------- */
  const handleFavorite = async (id, newValue, isFolder = item.isFolder) => {
    const token = localStorage.getItem("api_token");
    const url = isFolder
      ? newValue
        ? `${API_BASE}/Favorite_Folder/${id}`
        : `${API_BASE}/RemoveFavorite/${id}`
      : newValue
        ? `${API_BASE}/favoriteFile/${id}`
        : `${API_BASE}/RemoveFavoriteFile/${id}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setFavorite(newValue);
        handlers.onFavorite?.(id, newValue, isFolder);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- file url ---------- */
  const fileURL =
    item.file_url ||
    (item.file_path
      ? `${BASE_URL}/${item.file_path.replace(/^\/+/, "")}`
      : null);

  /* ---------- click / double click ---------- */
  const handleClick = (e) => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;

      // double click
      if (item.isFolder) {
        handlers.goToFolder?.(item.id);
        return;
      }

      if (
        item.mime_type === "application/msword" ||
        item.mime_type?.includes("spreadsheet") ||
        item.mime_type?.includes("presentation")
      ) {
        window.open(fileURL, "_blank");
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      handlers.onPreview?.({ ...item, preview_url: fileURL });
      return;
    }

    // single click → select
    clickTimeout.current = setTimeout(() => {
      handlers.setSelectedItems?.((prev) =>
        prev.some((i) => i.id === item.id)
          ? prev.filter((i) => i.id !== item.id)
          : [...prev, item],
      );
      clickTimeout.current = null;
    }, DOUBLE_CLICK_DELAY);
  };

  const renderGridIcon = () => {
    const type = item.mime_type || "";

    if (type === "application/pdf")
      return <FaFilePdf size={42} className="text-red-500" />;

    if (type.includes("word"))
      return <FaFileWord size={42} className="text-blue-600" />;

    if (type.includes("excel") || type.includes("spreadsheet"))
      return <FaFileExcel size={42} className="text-green-600" />;

    if (type.includes("presentation"))
      return <FaFilePowerpoint size={42} className="text-orange-500" />;

    if (type.startsWith("audio/"))
      return <FaFileAudio size={42} className="text-purple-500" />;

    if (type.startsWith("video/"))
      return <AiFillPlayCircle size={42} className="text-indigo-500" />;

    return <FaFileAlt size={42} className="text-gray-500" />;
  };

  /* ================= GRID ================= */
  const renderGrid = () => {
    const fileName = item.file_name || item.name || "";
    const ext = fileName.split(".").pop()?.toLowerCase();

    const isImage =
      item.mime_type?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);

    const isVideo =
      item.mime_type?.startsWith("video/") ||
      ["mp4", "mov", "avi", "mkv"].includes(ext);
    const isPdf = item.mime_type === "application/pdf";

    return (
      <div
        onClick={handleClick}
        className={`relative rounded-xl border overflow-hidden cursor-pointer
        transition-all duration-200 group bg-white
        ${
          isSelected
            ? "border-sky-400 shadow-md"
            : "border-gray-200 hover:border-sky-400 hover:shadow-md"
        }`}
      >
        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-sky-400/10 z-0 pointer-events-none" />
        )}

        {/* Preview */}
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {isImage && fileURL ? (
            <img
              src={fileURL}
              alt={item.file_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : isVideo && fileURL ? (
            <div className="relative w-full h-full">
              <video
                src={fileURL}
                muted
                preload="metadata"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <AiFillPlayCircle
                  size={36}
                  className="text-white drop-shadow"
                />
              </div>
            </div>
          ) : item.isFolder ? (
            <div className="w-full h-full flex items-center justify-center bg-blue-50">
              <TbFolderFilled size={46} className="text-blue-500" />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex items-center justify-center bg-red-50">
              <FaFilePdf size={46} className="text-red-500" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              {renderGridIcon()}
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
        </div>

        {/* Info */}
        <div className="p-3 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-800 truncate">
              {item.file_name || item.name}
            </span>
            {favorite && (
              <FaStar size={14} className="text-yellow-400 shrink-0" />
            )}
          </div>

          <div className="mt-1 text-xs text-gray-500 flex justify-between">
            <span>{item.size_mb || "0"} MB</span>
            <span>{item.updated_at?.slice(0, 10)}</span>
          </div>
        </div>

        {/* Menu */}
        <div className="absolute top-2 right-2 z-40">
          <MenuActions
            item={item}
            handlers={{ ...handlers, onFavorite: handleFavorite }}
            isTrash={isTrash}
            favorite={favorite}
          />
        </div>
      </div>
    );
  };

  const renderFileIcon = () => {
    const type = item.mime_type || "";

    if (type === "application/pdf")
      return <FaFilePdf className="text-red-500" size={18} />;

    if (type.includes("word"))
      return <FaFileWord className="text-blue-600" size={18} />;

    if (type.includes("excel") || type.includes("spreadsheet"))
      return <FaFileExcel className="text-green-600" size={18} />;

    if (type.includes("presentation"))
      return <FaFilePowerpoint className="text-orange-500" size={18} />;

    if (type.startsWith("audio/"))
      return <FaFileAudio className="text-purple-500" size={18} />;

    if (type.startsWith("video/"))
      return <AiFillPlayCircle className="text-indigo-500" size={18} />;

    return <FaFileAlt className="text-gray-500" size={18} />;
  };

  /* ================= LIST ================= */
  const renderList = () => (
    <div
      onClick={handleClick}
      className={`
  relative grid grid-cols-6 items-center
  px-3 py-2 rounded-xl
  transition-all duration-200 cursor-pointer
  bg-white
  ${
    isSelected
      ? "ring-2 ring-sky-400 bg-sky-50 shadow-sm"
      : "hover:bg-neutral-200"
  }
`}
    >
      {/* Selected overlay */}
      {isSelected && (
        <div className="rounded-xl absolute inset-0 bg-sky-500/20 z-0 pointer-events-none" />
      )}

      <div className="col-span-3 flex items-center gap-2 truncate">
        {item.isFolder ? (
          <TbFolderFilled size={18} className="text-blue-500 shrink-0" />
        ) : isImage ? (
          <img
            src={fileURL}
            alt={item.file_name}
            className="w-7 h-7 rounded object-cover shrink-0"
          />
        ) : item.mime_type?.startsWith("video/") ? (
          <div className="relative w-7 h-7 rounded overflow-hidden shrink-0">
            <video
              src={fileURL}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <AiFillPlayCircle className="text-white" size={10} />
            </div>
          </div>
        ) : (
          <div className="shrink-0">{renderFileIcon()}</div>
        )}

        <span className="truncate text-sm font-medium text-gray-800 flex items-center gap-1">
          {item.file_name || item.name}
          {favorite && <FaStar size={14} className="text-yellow-400" />}
        </span>
      </div>

      <div className="col-span-1 text-xs text-gray-500 text-center">
        {item.size_mb || "0"} MB
      </div>

      <div className="col-span-1 text-xs text-gray-500 text-center">
        {item.updated_at?.slice(0, 10)}
      </div>

      <div className="col-span-1 flex justify-end">
        <MenuActions
          item={item}
          handlers={{ ...handlers, onFavorite: handleFavorite }}
          isTrash={isTrash}
          favorite={favorite}
        />
      </div>
    </div>
  );

  /* ================= RENDER ================= */
  if (layout === "grid") return renderGrid();
  return renderList();
}
