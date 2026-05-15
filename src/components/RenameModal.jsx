import React, { useState, useEffect, useRef } from "react";
import { FiEdit3, FiX } from "react-icons/fi";
import { API_BASE } from "../api/api";

export default function RenameModal({ isOpen, onClose, item, onRenameSuccess }) {
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  

  useEffect(() => {
    if (item && isOpen) {
      const name = item.isFolder ? item.name || "" : item.file_name || "";
      setNewName(name);
      setError("");
      
      // Focus และ Select ข้อความอัตโนมัติ (ไม่รวมนามสกุลไฟล์)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const lastDotIndex = name.lastIndexOf(".");
          if (!item.isFolder && lastDotIndex > 0) {
            inputRef.current.setSelectionRange(0, lastDotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 100);
    }
  }, [item, isOpen]);

  const handleSubmit = async () => {
    if (!newName.trim()) return setError("กรุณากรอกชื่อ");
    if (!item) return setError("ไม่พบข้อมูลไฟล์หรือโฟลเดอร์");

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("api_token") || localStorage.getItem("token");
      let endpoint = item.isFolder
        ? `${API_BASE}/rename_folder/${item.id}`
        : `${API_BASE}/rename_file/${item.id}`;
      
      let payload = item.isFolder ? { name: newName } : { file_name: newName };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onRenameSuccess?.(item.id, newName, item.isFolder);
        onClose();
      } else {
        setError(data.message || "เกิดข้อผิดพลาดในการเปลี่ยนชื่อ");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
            <FiEdit3 />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">เปลี่ยนชื่อ</h3>
            <p className="text-sm text-gray-400 font-medium">ระบุชื่อใหม่สำหรับ{item?.isFolder ? "โฟลเดอร์" : "ไฟล์"}นี้</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-4">
          <div className="group">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl transition-all duration-200 focus:outline-none focus:bg-white
                ${error ? "border-rose-200 focus:border-rose-500" : "border-transparent focus:border-indigo-500"}`}
              placeholder="ระบุชื่อใหม่..."
              disabled={loading}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 text-rose-500 text-sm font-bold animate-in fade-in slide-in-from-top-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !newName.trim()}
            className="flex-[1.5] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึก</span>
              </div>
            ) : "บันทึกชื่อใหม่"}
          </button>
        </div>

        {/* Close Icon Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>
    </div>
  );
}