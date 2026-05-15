import React, { useEffect } from "react";

export default function Popup({
  show,
  title,       // เพิ่มหัวข้อ
  message,     // เพิ่มรายละเอียด
  type = "success",
  onClose,
  onConfirm,
  onCancel,
  autoClose = true,
}) {
  useEffect(() => {
    // ถ้าเป็น Success และไม่มีปุ่ม Confirm ให้ปิดเองอัตโนมัติ
    if (show && autoClose && !onConfirm) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, onConfirm, onClose]);

  if (!show) return null;

  const config = {
    success: {
      iconBg: "bg-emerald-100",
      btnColor: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200",
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 52 52">
          <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
          <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      ),
    },
    error: {
      iconBg: "bg-rose-100",
      btnColor: "bg-rose-500 hover:bg-rose-600 shadow-rose-200",
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 52 52">
          <circle className="error__circle" cx="26" cy="26" r="25" fill="none" />
          <path className="error__line" fill="none" d="M16 16 36 36 M36 16 16 36" />
        </svg>
      ),
    },
    warning: {
      iconBg: "bg-amber-100",
      btnColor: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="4">
          <path strokeLinecap="round" className="warning__dash" d="M26 12v20" />
          <circle cx="26" cy="40" r="2" fill="currentColor" className="warning__dot" />
        </svg>
      ),
    },
  };

  const current = config[type] || config.success;

  return (
    <>
      <style>{`
        .checkmark__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10; stroke: #10b981; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
        .checkmark__check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke-width: 3; stroke: #10b981; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }
        .error__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke: #f43f5e; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
        .error__line { stroke-dasharray: 48; stroke-dashoffset: 48; stroke-width: 3; stroke: #f43f5e; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards; }
        .warning__dash { stroke-dasharray: 20; stroke-dashoffset: 20; animation: stroke 0.3s ease forwards 0.5s; }
        .warning__dot { opacity: 0; animation: fadeIn 0.3s ease forwards 0.8s; }
        @keyframes stroke { 100% { stroke-dashoffset: 0; } }
        @keyframes fadeIn { 100% { opacity: 1; } }
      `}</style>

      {/* เพิ่ม z-[99999] เพื่อให้อยู่บนสุดเหนือทุกอย่าง */}
      <div className="fixed inset-0 flex items-center justify-center z-[99999] p-4 font-kanit">
        <div 
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" 
          onClick={!onConfirm ? onClose : undefined} 
        />

        <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-[360px] text-center animate-in zoom-in-95 duration-300">
          
          <div className={`w-24 h-24 mx-auto mb-6 rounded-[2rem] flex items-center justify-center ${current.iconBg}`}>
            {current.icon}
          </div>

          <h3 className="text-gray-900 font-bold text-xl mb-2 leading-tight">
            {title}
          </h3>
          <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed px-4">
            {message}
          </p>

          {onConfirm ? (
            <div className="flex flex-col gap-2">
              <button
                className={`w-full py-4 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg ${current.btnColor}`}
                onClick={() => { onConfirm(); onClose(); }}
              >
                ยืนยันการดำเนินการ
              </button>
              <button
                className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors active:scale-95"
                onClick={() => { onCancel?.(); onClose(); }}
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <div className="pt-2">
               <button onClick={onClose} className="px-8 py-3 rounded-xl bg-gray-50 text-gray-400 font-bold hover:bg-gray-100 transition-all active:scale-95">
                ปิดหน้าต่าง
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}   