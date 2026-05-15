import React from "react";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";

export default function Breadcrumb({ 
  currentPath = [], 
  onNavigate,
  title = "แชร์กับฉัน",           // เปลี่ยนจาก pageTitle เป็น title
  subtitle = "ไฟล์และโฟลเดอร์ทั้งหมดที่ถูกแชร์ให้คุณ"  // เพิ่ม subtitle
}) {
  const canGoBack = currentPath.length > 0;

  // 🔙 ย้อนกลับทีละระดับ
  const handleBack = () => {
    if (currentPath.length === 0) return;

    if (currentPath.length > 1) {
      // ย้อนจาก /a/b/c → /a/b
      onNavigate(currentPath.length - 2);
    } else {
      // ย้อนจาก /a → root
      onNavigate(-1);
    }
  };

  // คำนวณตำแหน่งปัจจุบัน
  const currentPosition = currentPath.length > 0 
    ? currentPath[currentPath.length - 1] 
    : null;

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* แถวที่ 1: ปุ่มย้อนกลับ + ชื่อหน้า */}
      <div className="flex items-center gap-3">
        {/* ⬅️ Back Button */}
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className={`
            flex items-center justify-center
            w-9 h-9 rounded-xl
            border bg-white shadow-sm
            transition
            ${
              canGoBack
                ? "hover:bg-gray-100 text-gray-700"
                : "opacity-40 cursor-not-allowed"
            }
          `}
          title="ย้อนกลับ"
        >
          <FiArrowLeft size={16} />
        </button>
        
        {/* ชื่อหน้าและคำอธิบาย */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {currentPosition ? currentPosition.name : title}
            </h1>
            
            {/* Badge สำหรับแสดงว่าอยู่ในโฟลเดอร์ย่อย */}
            {currentPosition && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ในโฟลเดอร์
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mt-1">
            {currentPosition 
              ? `โฟลเดอร์: ${currentPath.map(p => p.name).join(' / ')}`
              : subtitle
            }
          </p>
        </div>
      </div>

      {/* แถวที่ 2: Breadcrumb path */}
      {currentPath.length > 0 && (
        <div className="flex items-center gap-2 ml-12">
          {/* 📍 Path สำหรับ Desktop */}
          <div className="hidden md:flex items-center gap-1 px-3 py-2 rounded-xl bg-white shadow-sm border text-sm text-gray-600 overflow-hidden">
            {/* Root */}
            <span
              onClick={() => onNavigate(-1)}
              className="
                cursor-pointer font-medium
                text-gray-700 hover:text-blue-600
                whitespace-nowrap px-1 hover:bg-blue-50 rounded
              "
            >
              {title}
            </span>

            {currentPath.map((p, i) => (
              <React.Fragment key={p.id}>
                <FiChevronRight
                  className="text-gray-400 shrink-0"
                  size={14}
                />

                <span
                  onClick={() => onNavigate(i)}
                  className={`
                    cursor-pointer truncate max-w-[140px] px-1
                    hover:bg-blue-50 rounded
                    ${
                      i === currentPath.length - 1
                        ? "text-gray-900 font-semibold"
                        : "hover:text-blue-600"
                    }
                  `}
                  title={p.name}
                >
                  {p.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* 📱 Mobile Path (ย่อ) */}
          <div className="md:hidden flex items-center gap-1 px-3 py-2 rounded-xl bg-white shadow-sm border text-sm text-gray-600 overflow-hidden">
            <FiChevronRight className="text-gray-400" size={14} />
            <span className="font-medium text-gray-700 truncate">
              {currentPath.length > 1 
                ? `... / ${currentPath.slice(-2).map(p => p.name).join(' / ')}`
                : currentPath[0]?.name
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}