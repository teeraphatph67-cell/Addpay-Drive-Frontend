// src/components/DownloadProgress.jsx
import React, { useEffect, useState } from 'react';
import { FiDownload, FiCheck, FiAlertCircle, FiX, FiFile, FiArchive, FiFileText, FiFolder } from 'react-icons/fi';

const DownloadProgress = ({ 
  percent = 0, 
  visible = false, 
  onClose,
  fileName = '',
  fileSize = null,
  fileCount = 1,
  items = []  // ✅ เพิ่ม items props
}) => {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // ✅ เพิ่ม state สำหรับแสดง/ซ่อนรายละเอียด

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else if (!visible && percent === 100) {
      const timer = setTimeout(() => {
        setShow(false);
        if (onClose) onClose();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, percent, onClose]);

  if (!show && !visible) return null;

  const isDownloading = visible && percent < 100;
  const isSuccess = !visible && percent === 100;
  const isError = !visible && percent === 0 && !show;

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Get file icon based on type (รองรับโฟลเดอร์)
  const getFileIcon = (item) => {
    if (item?.type === 'folder') {
      return <FiFolder className="text-yellow-500" />;
    }
    
    const ext = item?.name?.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <FiFile className="text-purple-500" />;
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      return <FiFile className="text-blue-500" />;
    } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return <FiFile className="text-green-500" />;
    } else if (['pdf'].includes(ext)) {
      return <FiFile className="text-red-500" />;
    } else if (['doc', 'docx'].includes(ext)) {
      return <FiFile className="text-blue-700" />;
    } else if (['xls', 'xlsx'].includes(ext)) {
      return <FiFile className="text-green-700" />;
    } else if (['zip', 'rar', '7z'].includes(ext)) {
      return <FiArchive className="text-yellow-600" />;
    } else if (['txt', 'md'].includes(ext)) {
      return <FiFileText className="text-gray-600" />;
    }
    
    return <FiFile />;
  };

  // Truncate filename
  const truncateFileName = (name, maxLength = 30) => {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    
    const ext = name.split('.').pop();
    const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
    
    if (nameWithoutExt.length <= maxLength - 3) return name;
    
    return `${nameWithoutExt.slice(0, maxLength - 3)}...${ext ? `.${ext}` : ''}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-96 overflow-hidden backdrop-blur-lg backdrop-filter">
        {/* Header with gradient */}
        <div className={`px-5 py-4 ${
          isDownloading ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
          isSuccess ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
          'bg-gradient-to-r from-red-50 to-rose-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated icon */}
              <div className={`relative ${
                isDownloading ? 'animate-bounce' : ''
              }`}>
                <div className={`p-2.5 rounded-xl ${
                  isDownloading ? 'bg-blue-500 shadow-lg shadow-blue-200' :
                  isSuccess ? 'bg-green-500 shadow-lg shadow-green-200' :
                  'bg-red-500 shadow-lg shadow-red-200'
                } text-white`}>
                  {isDownloading && <FiDownload className="w-5 h-5 animate-pulse" />}
                  {isSuccess && <FiCheck className="w-5 h-5" />}
                  {isError && <FiAlertCircle className="w-5 h-5" />}
                </div>
                
                {/* Loading spinner for downloading */}
                {isDownloading && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800">
                  {isDownloading && 'กำลังดาวน์โหลด...'}
                  {isSuccess && 'ดาวน์โหลดสำเร็จ!'}
                  {isError && 'ดาวน์โหลดล้มเหลว'}
                </h3>
                
                {/* File info - ใช้ items ถ้ามี */}
                {fileCount === 1 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">
                      {items.length > 0 ? getFileIcon(items[0]) : <FiFile />}
                    </span>
                    <p className="text-sm text-gray-600 font-medium">
                      {truncateFileName(fileName)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {fileCount} รายการ {fileSize > 0 && `• ${formatFileSize(fileSize)}`}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => {
                setShow(false);
                if (onClose) onClose();
              }}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-all duration-200 group"
            >
              <FiX size={18} className="text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Progress Section */}
        {isDownloading && (
          <div className="p-5">
            {/* Progress bar with animation */}
            <div className="relative">
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${percent}%` }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                </div>
              </div>
              
              {/* Percentage and size */}
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm font-semibold text-blue-600">
                  {percent}%
                </span>
                {fileSize > 0 && (
                  <span className="text-xs text-gray-500">
                    {formatFileSize(fileSize * percent / 100)} / {formatFileSize(fileSize)}
                  </span>
                )}
              </div>
            </div>

            {/* แสดงรายละเอียดไฟล์สำหรับหลายไฟล์ */}
            {fileCount > 1 && items.length > 0 && (
              <>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  {showDetails ? 'ซ่อน' : 'แสดง'}รายละเอียด
                  <svg
                    className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* รายการไฟล์ทั้งหมด */}
                {showDetails && (
                  <div className="mt-3 max-h-40 overflow-y-auto custom-scrollbar">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 py-1.5 text-xs border-b border-gray-100 last:border-0">
                        <span className="text-gray-400">
                          {getFileIcon(item)}
                        </span>
                        <span className="flex-1 text-gray-600 truncate" title={item.name}>
                          {truncateFileName(item.name, 25)}
                        </span>
                        {item.size > 0 && (
                          <span className="text-gray-400">
                            {formatFileSize(item.size)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Download speed indicator (fake) */}
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>กำลังดาวน์โหลด • {(percent * 0.5).toFixed(1)} MB/s</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-5">
            <div className="flex items-center gap-3 text-green-600 bg-green-50/80 p-4 rounded-xl border border-green-100">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <FiCheck size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700">บันทึกไฟล์เรียบร้อย</p>
                <p className="text-xs text-green-600 mt-0.5">
                  {fileCount > 1 
                    ? `${fileCount} รายการ พร้อมใช้งาน` 
                    : fileName 
                      ? `${truncateFileName(fileName, 40)} พร้อมใช้งาน`
                      : 'ไฟล์พร้อมใช้งาน'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {isError && (
          <div className="p-5">
            <div className="bg-red-50/80 p-4 rounded-xl border border-red-100">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <FiAlertCircle size={18} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-red-700">เกิดข้อผิดพลาด</p>
                  <p className="text-xs text-red-600 mt-0.5 mb-3">
                    ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาลองอีกครั้ง
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-medium text-red-700 transition-colors"
                  >
                    ลองใหม่
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with time */}
        <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-shine {
          animation: shine 2s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default DownloadProgress;