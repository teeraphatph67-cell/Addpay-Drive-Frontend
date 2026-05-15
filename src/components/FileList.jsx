import React, { useState, useRef } from "react";
import FileCard from "./FileCard";
import FolderCard from "./FolderCard";
import SelectionToolbar from "./SelectionToolbar";
import LoadingSpinner from "./LoadingSpinner";
import {
  FiGrid,
  FiList,
  FiUploadCloud,
  FiFolder,
  FiFile,
  FiChevronRight,
} from "react-icons/fi";
import { BASE_URL } from "../api/api";

export default function FileList({
  files = [],
  goToFolder,
  handlers = {},
  isTrash = false,
  selectedItems = [],
  setSelectedItems = () => {},
  selectedIds = [],
  setSelectedIds = () => {},
  isLoading = false,
  // รับ Props เพิ่มเติมสำหรับการทำ Navigation
  path = [],
  currentParent = null,
}) {
  /* ---------- Layout & UI State ---------- */
  const [layout, setLayout] = useState(
    () => localStorage.getItem("fileLayout") || "grid",
  );

  const [gridSize, setGridSize] = useState(
    () => Number(localStorage.getItem("gridSize")) || 1,
  );

  /* ---------- Drag & Drop Logic ---------- */
  const dragCounter = useRef(0);
  const [dragActive, setDragActive] = useState(false);

  /* ---------- Double Click Logic ---------- */
  const clickTimer = useRef(null);
  const DOUBLE_CLICK_DELAY = 250;

  /* ---------- Grid Responsive Mapping ---------- */
  const gridClassMap = {
    1: "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
    2: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    6: "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  /* ---------- Data Preparation ---------- */
  const filesWithURL = files.map((f) => ({
    ...f,
    file_url: f.file_path
      ? `${BASE_URL}${f.file_path.replace(/^\/+/, "")}`
      : f.url_file || null,
  }));

  const folders = filesWithURL.filter((f) => f.isFolder);
  const regularFiles = filesWithURL.filter((f) => !f.isFolder);
  const selectedCount = isTrash ? selectedIds.length : selectedItems.length;

  /* ---------- Event Handlers ---------- */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (!isTrash) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);
    if (
      !isTrash &&
      handlers.handleUploadFiles &&
      e.dataTransfer.files?.length > 0
    ) {
      handlers.handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleItemClick = (item) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      if (item.isFolder) {
        goToFolder(item.id);
      } else {
        handlers.onPreview?.({ ...item, preview_url: item.file_url });
      }
      return;
    }

    clickTimer.current = setTimeout(() => {
      if (isTrash) {
        setSelectedIds((prev) =>
          prev.includes(item.id)
            ? prev.filter((id) => id !== item.id)
            : [...prev, item.id],
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
    <div
      className="relative w-full min-h-[400px] flex flex-col"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1. Header Toolbar (Breadcrumbs & Navigation) */}
      <div
        className="
  sticky top-0 z-20
  bg-white/70 backdrop-blur-xl
  border-b border-slate-100/50
  px-4 py-3 sm:px-6 sm:py-4
  flex flex-col sm:flex-row
  gap-3 sm:gap-0
  sm:items-center sm:justify-between
  rounded-t-[24px] sm:rounded-t-[32px]
"
      >
        {/* Left Side: Back Button & Path Navigation */}
        <div className="flex items-center gap-3">
          {/* ปุ่มย้อนกลับ (แสดงเมื่อไม่ได้อยู่ที่หน้าแรก) */}
          {currentParent && (
            <button
              onClick={() => {
                if (path.length > 1) {
                  const prevFolder = path[path.length - 2];
                  goToFolder(prevFolder.id);
                } else {
                  goToFolder(null);
                }
              }}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-90"
            >
              <FiChevronRight className="rotate-180" size={20} />
            </button>
          )}

          {/* Breadcrumbs Path */}
          <div
            className="
  flex items-center gap-1.5
  overflow-x-auto no-scrollbar
  whitespace-nowrap py-1
  max-w-full
"
          >
            {/* หน้าแรก (Root) */}
            <button
              onClick={() => goToFolder(null)}
              className={`text-sm font-bold flex-shrink-0 transition-colors ${
                !currentParent
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              ไฟล์ทั้งหมด
            </button>

            {/* ลำดับโฟลเดอร์ (Breadcrumbs) */}
            {path &&
              path.map((folder, index) => (
                <React.Fragment key={folder.id || index}>
                  <FiChevronRight
                    className="text-slate-300 flex-shrink-0"
                    size={14}
                  />
                  <button
                    onClick={() => goToFolder(folder.id)}
                    className={`text-sm font-bold truncate transition-colors ${
                      index === path.length - 1
                        ? "text-slate-900 max-w-[150px]" // โฟลเดอร์ปัจจุบันให้กว้างได้หน่อย
                        : "text-slate-400 hover:text-slate-600 max-w-[100px]" // โฟลเดอร์ทางผ่านให้แคบลง
                    }`}
                    title={folder.name} // เอาเมาส์ชี้เพื่อดูชื่อเต็ม
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}

            {/* จำนวนรายการ - แนะนำให้แยกออกไปอยู่ขวาสุด หรือใช้ flex-grow เพื่อดันตำแหน่ง */}
            <div className="flex-grow"></div>

            <span className="ml-2 flex-shrink-0 hidden sm:inline-block bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border border-slate-200">
              {files.length} รายการ
            </span>
          </div>
        </div>

        {/* Right Side: Grid/List Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {layout === "grid" && (
            <div
              className="
        flex items-center gap-3
        bg-slate-50 px-3 py-2
        rounded-xl border border-slate-100
        w-full sm:w-auto
      "
            >
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
                  localStorage.setItem("gridSize", e.target.value);
                }}
                className="flex-1 sm:w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          )}

          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-100 self-end sm:self-auto">
            <button
              onClick={() => {
                setLayout("grid");
                localStorage.setItem("fileLayout", "grid");
              }}
              className={`p-2 rounded-lg transition-all ${
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
                localStorage.setItem("fileLayout", "list");
              }}
              className={`p-2 rounded-lg transition-all ${
                layout === "list"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-slate-400"
              }`}
            >
              <FiList size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Selection Toolbar */}
      {selectedCount > 0 && (
        <SelectionToolbar
          count={selectedCount}
          onDelete={handlers.onDeleteSelected}
          onRestore={handlers.onRestoreSelected}
          onClear={
            isTrash ? () => setSelectedIds([]) : () => setSelectedItems([])
          }
          onDownload={handlers.onDownload}
          isTrash={isTrash}
        />
      )}

      {/* 3. Main Content Container */}
      <div className="p-4 sm:p-6 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <LoadingSpinner size="large" color="blue" />
            <p className="mt-4 text-sm text-gray-400 animate-pulse">
              กำลังโหลดข้อมูล...
            </p>
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center group">
            <div className="bg-blue-50 p-8 rounded-full mb-4 group-hover:scale-110 transition-transform duration-500">
              <FiUploadCloud className="text-blue-500 text-6xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">ที่นี่ว่างเปล่า</h3>
            <p className="text-gray-400 text-sm">
              ลากไฟล์มาวางที่นี่เพื่อเริ่มต้นใช้งาน
            </p>
          </div>
        ) : (
          <>
            {/* Folder Section */}
            {folders.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <FiFolder className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Folders
                  </span>
                  <div className="h-px flex-1 bg-slate-50"></div>
                </div>
                <div className={`grid gap-5 ${gridClassMap[gridSize]}`}>
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => handleItemClick(folder)}
                    >
                      <FolderCard
                        item={folder}
                        handlers={handlers}
                        isTrash={isTrash}
                        isSelected={
                          isTrash
                            ? selectedIds.includes(folder.id)
                            : selectedItems.some((i) => i.id === folder.id)
                        }
                        gridSize={gridSize}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Section */}
            {regularFiles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FiFile className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Files
                  </span>
                  <div className="h-px flex-1 bg-slate-50"></div>
                </div>

                {layout === "grid" ? (
                  <div className={`grid gap-5 ${gridClassMap[gridSize]}`}>
                    {regularFiles.map((file) => (
                      <div key={file.id} onClick={() => handleItemClick(file)}>
                        <FileCard
                          item={file}
                          layout={layout}
                          handlers={handlers}
                          isTrash={isTrash}
                          isSelected={
                            isTrash
                              ? selectedIds.includes(file.id)
                              : selectedItems.some((i) => i.id === file.id)
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {regularFiles.map((file) => (
                      <div key={file.id} onClick={() => handleItemClick(file)}>
                        <FileCard
                          item={file}
                          layout={layout}
                          handlers={handlers}
                          isTrash={isTrash}
                          isSelected={
                            isTrash
                              ? selectedIds.includes(file.id)
                              : selectedItems.some((i) => i.id === file.id)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. Drag Overlay */}
      {dragActive && !isTrash && (
        <div className="absolute inset-0 z-50 bg-blue-600/10 backdrop-blur-[2px] border-4 border-dashed border-blue-500 m-2 rounded-2xl flex flex-col items-center justify-center pointer-events-none transition-all">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center">
            <FiUploadCloud className="text-blue-600 text-7xl mb-4 animate-bounce" />
            <p className="text-xl font-bold text-gray-800">
              ปล่อยเพื่ออัปโหลดไฟล์
            </p>
            <p className="text-sm text-gray-500">
              ไฟล์จะถูกบันทึกไว้ในโฟลเดอร์นี้
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
