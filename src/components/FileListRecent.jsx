import React, { useState, useRef, useMemo } from "react";
import RecentFileCard from "./RecentFileCard";
import LoadingSpinner from "./LoadingSpinner";
import {
  FiGrid,
  FiList,
  FiClock,
  FiChevronRight,
  FiFile,
  FiActivity,
} from "react-icons/fi";
import { BASE_URL } from "../api/api";

export default function FileListRecent({
  files = [],
  onPreview,
  isLoading = false,
  isTrash = false,
  selectedItems = [],
  setSelectedItems = () => {},
  selectedIds = [],
  setSelectedIds = () => {},
}) {
  /* ---------- Layout & UI State ---------- */
  const [layout, setLayout] = useState(
    () => localStorage.getItem("recentLayout") || "list"
  );

  const [gridSize, setGridSize] = useState(
    () => Number(localStorage.getItem("recentGridSize")) || 5
  );

  /* ---------- Double Click Logic ---------- */
  const clickTimer = useRef(null);
  const DOUBLE_CLICK_DELAY = 250;

  /* ---------- Responsive Grid Mapping ---------- */
  const gridClassMap = {
    1: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
    2: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7",
    3: "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    6: "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  /* ---------- Data Preparation ---------- */
  const filesWithURL = useMemo(
    () =>
      files.map((f) => ({
        ...f,
        file_url: f.file_path
          ? `${BASE_URL}/${f.file_path.replace(/^\/+/, "")}`
          : f.url_file || null,
      })),
    [files]
  );

  const regularFiles = filesWithURL.filter((f) => !f.isFolder);

  /* ---------- Event Handlers ---------- */
  const handleItemClick = (item) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onPreview?.({ ...item, preview_url: item.file_url });
      return;
    }

    clickTimer.current = setTimeout(() => {
      if (isTrash) {
        setSelectedIds((prev) =>
          prev.includes(item.id)
            ? prev.filter((id) => id !== item.id)
            : [...prev, item.id]
        );
      } else {
        setSelectedItems((prev) => {
          const exists = prev.some((i) => i.id === item.id);
          return exists
            ? prev.filter((i) => i.id !== item.id)
            : [...prev, item];
        });
      }
      clickTimer.current = null;
    }, DOUBLE_CLICK_DELAY);
  };

  return (
    <div className="relative w-full min-h-[400px] flex flex-col animate-in fade-in duration-700">
      {/* ================= Header ================= */}
      <div className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-100/50 px-4 sm:px-6 py-4 rounded-t-[28px]">
        {/* Row 1 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-1.5 rounded-xl border border-blue-100/50">
              <FiClock className="text-blue-500" size={14} />
              <span className="text-sm font-black text-blue-900 uppercase tracking-tight">
                ล่าสุด
              </span>
            </div>

            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border border-slate-200">
              {regularFiles.length} รายการ
            </span>
          </div>

          {/* Layout Switch */}
          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-100">
            <button
              onClick={() => {
                setLayout("grid");
                localStorage.setItem("recentLayout", "grid");
              }}
              className={`p-2 rounded-lg transition ${
                layout === "grid"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-400"
              }`}
            >
              <FiGrid size={18} />
            </button>
            <button
              onClick={() => {
                setLayout("list");
                localStorage.setItem("recentLayout", "list");
              }}
              className={`p-2 rounded-lg transition ${
                layout === "list"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-400"
              }`}
            >
              <FiList size={18} />
            </button>
          </div>
        </div>

        {/* Row 2: Grid Size (Desktop only) */}
        {layout === "grid" && (
          <div className="hidden md:flex mt-4 items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-fit">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              Grid Size
            </span>
            <input
              type="range"
              min="1"
              max="6"
              value={gridSize}
              onChange={(e) => {
                setGridSize(Number(e.target.value));
                localStorage.setItem("recentGridSize", e.target.value);
              }}
              className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        )}
      </div>

      {/* ================= Content ================= */}
      <div className="p-4 sm:p-6 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <LoadingSpinner size="large" color="blue" />
            <p className="mt-4 text-sm text-gray-400 animate-pulse font-medium">
              กำลังโหลดข้อมูลล่าสุด...
            </p>
          </div>
        ) : regularFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-slate-100 rounded-[28px] bg-slate-50/40">
            <div className="bg-white p-8 rounded-full mb-4 shadow-sm">
              <FiActivity className="text-slate-200 text-6xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">
              ไม่มีประวัติการใช้งาน
            </h3>
            <p className="text-gray-400 text-sm max-w-[260px] mx-auto">
              ไฟล์ที่คุณเปิดล่าสุดจะปรากฏที่นี่
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FiFile className="text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Files
              </span>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div
              className={
                layout === "grid"
                  ? `grid gap-4 ${gridClassMap[gridSize]}`
                  : "space-y-3"
              }
            >
              {regularFiles.map((file) => (
                <div key={file.id} onClick={() => handleItemClick(file)}>
                  <RecentFileCard
                    item={file}
                    layout={layout}
                    isSelected={
                      isTrash
                        ? selectedIds.includes(file.id)
                        : selectedItems.some((i) => i.id === file.id)
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
