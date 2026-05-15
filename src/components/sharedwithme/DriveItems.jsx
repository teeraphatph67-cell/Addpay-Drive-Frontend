import React, { useState } from "react";
import { BASE_URL } from "../../api/api.js";
import {
  FiImage,
  FiFile,
  FiFolder,
} from "react-icons/fi";

/* =========================
   Helper
========================= */
const isImageFile = (ext) =>
  ["jpg", "jpeg", "png", "gif", "webp"].includes(ext?.toLowerCase());

/* =========================
   Folder Card
========================= */
export const FolderCard = ({ folder, onDoubleClick }) => {
  return (
    <div
      onDoubleClick={onDoubleClick}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-center justify-center h-24 bg-yellow-50 rounded-lg">
        <FiFolder className="text-5xl text-yellow-500" />
      </div>

      <div className="mt-3 text-sm font-medium text-gray-800 truncate">
        {folder.name}
      </div>
    </div>
  );
};

/* =========================
   File Card (⭐ THUMBNAIL ⭐)
========================= */
export const FileCard = ({ file, onDoubleClick }) => {
  const [imgError, setImgError] = useState(false);

  const isImage = isImageFile(file.file_ext);
  const thumbUrl = isImage
    ? `${BASE_URL}${file.file_path}`
    : null;

  return (
    <div
      onDoubleClick={onDoubleClick}
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {isImage && thumbUrl && !imgError ? (
          <img
            src={thumbUrl}
            alt={file.file_name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            {isImage ? (
              <FiImage className="text-4xl" />
            ) : (
              <FiFile className="text-4xl" />
            )}
          </div>
        )}

        {/* Badge */}
        {isImage && (
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
            IMAGE
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mt-2">
        <div className="text-sm font-medium text-gray-800 truncate">
          {file.file_name}
        </div>
        <div className="text-xs text-gray-500">
          {file.file_ext} • {file.size_mb} MB
        </div>
      </div>
    </div>
  );
};

/* =========================
   Breadcrumb (เดิม ใช้ต่อได้)
========================= */
export const Breadcrumb = ({ currentPath, onNavigate }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <span
        onClick={() => onNavigate(-1)}
        className="cursor-pointer hover:text-blue-600"
      >
        Shared with me
      </span>

      {currentPath.map((p, i) => (
        <React.Fragment key={p.id}>
          <span>/</span>
          <span
            onClick={() => onNavigate(i)}
            className="cursor-pointer hover:text-blue-600"
          >
            {p.name}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};
