import React from "react";
import { TbFolderFilled } from "react-icons/tb";
import { FaStar } from "react-icons/fa";
import { FiLock } from "react-icons/fi";
import MenuActions from "./MenuActions";

export default function FolderCard({
  item,
  goToFolder,
  handlers = {},
  isTrash = false,
  isSelected = false,
  gridSize = 4,
}) {
  const favorite = item.favorite === 1 || item.favorite === true;

  const displayName =
    item.file_name || item.name || item.folder_name || "Untitled";

  /* ---------- Responsive Size Mapping ---------- */
  const iconMap = {
    1: 40,
    2: 52,
    3: 64,
    4: 72,
    5: 88,
    6: 100,
  };

  const textMap = {
    1: "text-xs",
    2: "text-xs",
    3: "text-sm",
    4: "text-sm",
    5: "text-base",
    6: "text-lg",
  };

  return (
    <div
      onClick={() => goToFolder?.(item.id)}
      className={`
        relative group flex flex-col h-full
        rounded-2xl p-4
        transition-all duration-300 ease-out
        cursor-pointer select-none border-2
        ${
          isSelected
            ? "bg-sky-50/60 border-sky-400 shadow-lg shadow-sky-100"
            : "bg-white border-transparent shadow-sm hover:shadow-xl hover:border-gray-100 hover:-translate-y-1"
        }
      `}
    >
      {/* ---------- Selected Overlay ---------- */}
      {isSelected && (
        <div className="absolute inset-0 bg-sky-500/10 rounded-2xl pointer-events-none" />
      )}

      {/* ---------- Main Content ---------- */}
      <div className="relative z-10 flex flex-col items-center flex-1 justify-center text-center">
        <div className="relative">
          <TbFolderFilled
            size={iconMap[gridSize]}
            className={`
              transition-colors duration-300
              ${
                isSelected
                  ? "text-sky-500"
                  : "text-amber-400 group-hover:text-amber-500"
              }
            `}
          />

          {/* Favorite Star */}
          {favorite && (
            <FaStar
              size={12}
              className="absolute -top-1 -right-1 text-yellow-300"
            />
          )}

          {/* Lock (read only) */}
          {item.allow_edit === false && (
            <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-sm border border-gray-100">
              <FiLock size={10} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Folder Name */}
        <div
          className={`
            mt-3 px-2 w-full
            truncate font-semibold text-gray-700
            ${textMap[gridSize]}
          `}
          title={displayName}
        >
          {displayName}
        </div>
      </div>

      {/* ---------- Menu ---------- */}

      <div
        className="
      absolute top-2 right-2 z-40 rounded-xl hover:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <MenuActions
          item={{ ...item, isFolder: true }}
          handlers={handlers}
          isTrash={isTrash}
          favorite={favorite}
        />
      </div>
    </div>
  );
}
