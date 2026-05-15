import React, { useRef } from "react";

export default function SelectableItem({
  item,
  isSelected,
  onToggle,
  onOpen,
  children,
  layout = "grid", // "grid" หรือ "list"
}) {
  const clickTimer = useRef(null);
  const DELAY = 200;

  const handleClick = (e) => {
    e.stopPropagation();

    if (clickTimer.current) {
      // 👉 double click
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onOpen?.(item);
    } else {
      // 👉 single click (รอก่อน)
      clickTimer.current = setTimeout(() => {
        onToggle?.(item);
        clickTimer.current = null;
      }, DELAY);
    }
  };

  // สำหรับ Grid View (เหมือน RecentFileCard)
  if (layout === "grid") {
    return (
      <div
        onClick={handleClick}
        className={`
          relative cursor-pointer select-none touch-manipulation
          transition-all duration-200 active:scale-[0.98] rounded-2xl
          ${
            isSelected
              ? "ring-2 ring-blue-400 shadow-lg bg-blue-50/30"
              : "hover:border-blue-200 hover:shadow-md hover:-translate-y-1"
          }
        `}
      >
        {children}
        
        {/* Selection Indicator สำหรับ Grid */}
        {isSelected && (
          <>
            <div className="absolute inset-0 bg-blue-400/5 rounded-[24px] pointer-events-none" />
            <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
              <svg 
                className="w-3 h-3 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </>
        )}
      </div>
    );
  }

  // สำหรับ List View
  return (
    <div
      onClick={handleClick}
      className={`
        relative cursor-pointer select-none touch-manipulation
        transition-all duration-200
        ${
          isSelected
            ? "ring-1 ring-blue-300 bg-blue-50/50 shadow-sm border-blue-200"
            : "hover:bg-gray-50/70 hover:border-gray-200"
        }
      `}
    >
      {children}
      
      {/* Selection Indicator สำหรับ List */}
      {isSelected && (
        <>
          <div className="absolute inset-0 bg-blue-400/3 pointer-events-none" />
          <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10 w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
            <svg 
              className="w-3 h-3 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="3" 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}