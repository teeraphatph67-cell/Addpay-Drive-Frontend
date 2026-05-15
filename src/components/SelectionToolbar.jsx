import React from "react";
import { FiTrash2, FiRotateCw, FiX, FiDownload } from "react-icons/fi";

export default function SelectionToolbar({
  count,
  onClear,
  onDelete,
  onRestore,
  onDownload,
  isTrash = false,
}) {
  if (count === 0) return null;

  return (
    <>
      {/* Backdrop: ปรับให้จางลงมากที่สุดเพื่อไม่ให้รบกวนการมองเห็น */}
      <div className="fixed inset-0 z-40 pointer-events-none bg-black/[0.02]" />

      {/* Toolbar Container */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-max animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 px-2 py-2 rounded-2xl bg-white/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/60 pointer-events-auto">
          
          {/* Count & Clear Section */}
          <div className="flex items-center gap-2 pl-3 pr-4 border-r border-gray-100">
            <button
              onClick={onClear}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              title="ยกเลิกการเลือก"
            >
              <FiX size={18} />
            </button>
            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
              <span className="text-blue-600">{count}</span> รายการที่เลือก
            </span>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-1.5 pr-1">
            {!isTrash && (
              <ToolbarAction
                icon={<FiDownload size={16} />}
                label="ดาวน์โหลด"
                onClick={onDownload}
                className="text-blue-600 hover:bg-blue-50"
              />
            )}

            {isTrash ? (
              <>
                <ToolbarAction
                  icon={<FiRotateCw size={16} />}
                  label="กู้คืน"
                  onClick={onRestore}
                  className="text-emerald-600 hover:bg-emerald-50"
                />
                <ToolbarAction
                  icon={<FiTrash2 size={16} />}
                  label="ลบถาวร"
                  onClick={onDelete}
                  className="text-rose-600 hover:bg-rose-50"
                />
              </>
            ) : (
              <ToolbarAction
                icon={<FiTrash2 size={16} />}
                label="ย้ายไปถังขยะ"
                onClick={onDelete}
                className="text-rose-600 hover:bg-rose-50 font-bold"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ToolbarAction({ icon, label, onClick, className = "" }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${className}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}