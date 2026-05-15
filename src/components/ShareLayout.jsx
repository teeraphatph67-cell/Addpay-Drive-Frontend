import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiCloud, 
  FiArrowLeft, 
  FiMapPin, 
  FiPhone, 
  FiPrinter, 
  FiHardDrive, 
  FiUsers, 
  FiClock, 
  FiStar, 
  FiTrash2, 
  FiPlus 
} from 'react-icons/fi';

const ShareLayoutV2 = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-600 font-sans">
      {/* ================= HEADER (Centered Logo) ================= */}
      <header className="w-full h-20 bg-white border-b border-gray-50 flex items-center px-6 md:px-10 sticky top-0 z-50">
        <div className="flex-1">
          <button
            onClick={() => navigate("/mydrive")}
            className="group flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 transition-all duration-200 font-bold text-sm"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
            <span className="hidden md:inline">กลับไปยังไดรฟ์ของฉัน</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
            <FiCloud className="text-white text-xl" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">
            Addpay<span className="text-blue-500">Drive</span>
          </span>
        </div>

        <div className="flex-1 hidden md:block"></div>
      </header>

      <div className="flex flex-1">
      
        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 bg-[#fcfdfe] p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-6 md:p-10 min-h-[70vh]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-gray-50 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="pt-8 border-t border-gray-50 text-center">
            <p className="text-[10px] md:text-xs font-black text-sky-300 uppercase tracking-[0.3em]">
              © 2016 Addpay Service Point Co., Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Component ย่อยสำหรับเมนูที่มีจุดวงกลมด้านขวา
function NavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold text-[15px]
        ${active ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
    >
      <div className="flex items-center gap-4">
        <span className={`${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>{icon}</span>
        <span>{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
    </Link>
  );
}

export default ShareLayoutV2;