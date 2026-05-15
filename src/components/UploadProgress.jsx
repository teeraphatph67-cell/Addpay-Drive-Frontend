import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { FiUpload, FiCheck, FiAlertCircle, FiX, FiFile, FiArchive, FiFileText } from 'react-icons/fi';

export default function UploadProgress({ progress, onCancel }) {
  const [visibleProgress, setVisibleProgress] = useState({});

  useEffect(() => {
    if (!progress) return;
    setVisibleProgress(progress);
  }, [progress]);

  useEffect(() => {
    Object.entries(visibleProgress).forEach(([name, info]) => {
      if (info.percent >= 100) {
        const timer = setTimeout(() => {
          setVisibleProgress((prev) => {
            const copy = { ...prev };
            delete copy[name];
            return copy;
          });
        }, 3000); // เพิ่มเป็น 3 วิเหมือน download
        return () => clearTimeout(timer);
      }
    });
  }, [visibleProgress]);

  if (!visibleProgress || Object.keys(visibleProgress).length === 0) {
    return null;
  }

  // ตรวจสอบว่ามีไฟล์ที่กำลังอัปโหลดอยู่หรือไม่
  const isUploading = Object.values(visibleProgress).some(p => p.percent < 100);
  const isAllSuccess = Object.values(visibleProgress).every(p => p.percent >= 100);
  const hasError = Object.values(visibleProgress).some(p => p.error);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Get file icon based on extension
  const getFileIcon = (filename) => {
    if (!filename) return <FiFile />;
    
    const ext = filename.split('.').pop()?.toLowerCase();
    
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

  // Calculate total progress
  const totalProgress = () => {
    const files = Object.values(visibleProgress);
    if (files.length === 0) return 0;
    const total = files.reduce((acc, file) => acc + (file.percent || 0), 0);
    return Math.round(total / files.length);
  };

  return ReactDOM.createPortal(
    <div className="fixed bottom-4 right-4 z-[99999] animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-96 overflow-hidden backdrop-blur-lg backdrop-filter">
        {/* Header with gradient */}
        <div className={`px-5 py-4 ${
          isUploading ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
          isAllSuccess ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
          'bg-gradient-to-r from-red-50 to-rose-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated icon */}
              <div className={`relative ${isUploading ? 'animate-bounce' : ''}`}>
                <div className={`p-2.5 rounded-xl ${
                  isUploading ? 'bg-blue-500 shadow-lg shadow-blue-200' :
                  isAllSuccess ? 'bg-green-500 shadow-lg shadow-green-200' :
                  'bg-red-500 shadow-lg shadow-red-200'
                } text-white`}>
                  {isUploading && <FiUpload className="w-5 h-5 animate-pulse" />}
                  {isAllSuccess && <FiCheck className="w-5 h-5" />}
                  {hasError && <FiAlertCircle className="w-5 h-5" />}
                </div>
                
                {/* Loading spinner for uploading */}
                {isUploading && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800">
                  {isUploading && 'กำลังอัปโหลด...'}
                  {isAllSuccess && 'อัปโหลดสำเร็จ!'}
                  {hasError && 'อัปโหลดล้มเหลว'}
                </h3>
                
                {/* File count */}
                <p className="text-xs text-gray-500 mt-1">
                  {Object.keys(visibleProgress).length} ไฟล์
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setVisibleProgress({})}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-all duration-200 group"
            >
              <FiX size={18} className="text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Progress List */}
        <div className="p-5 max-h-80 overflow-y-auto custom-scrollbar">
          {Object.entries(visibleProgress).map(([name, info]) => (
            <div key={name} className="mb-4 last:mb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-gray-500">
                    {getFileIcon(name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate" title={name}>
                      {truncateFileName(name)}
                    </p>
                    {info.size && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatFileSize(info.size)}
                      </p>
                    )}
                  </div>
                </div>
                {info.percent < 100 && (
                  <button
                    onClick={() => onCancel?.(name)}
                    className="ml-2 text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-all duration-200 whitespace-nowrap"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${
                      info.percent >= 100 
                        ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                    }`}
                    style={{ width: `${info.percent ?? 0}%` }}
                  >
                    {/* Shine effect when in progress */}
                    {info.percent < 100 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                    )}
                  </div>
                </div>
                
                {/* Percentage and status */}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {info.percent ?? 0}%
                  </span>
                  {info.percent >= 100 ? (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <FiCheck size={12} />
                      เสร็จสิ้น
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {info.speed ? `${formatFileSize(info.speed)}/s` : 'กำลังอัปโหลด...'}
                    </span>
                  )}
                </div>
              </div>

              {/* Error message if any */}
              {info.error && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  {info.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer with total progress */}
        {Object.keys(visibleProgress).length > 0 && (
          <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                ความคืบหน้าทั้งหมด
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-blue-600">
                  {totalProgress()}%
                </span>
                <span className="text-xs text-gray-400">
                  {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animation keyframes */}
      <style>{`
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
    
    
      `}</style>
    </div>,
    document.body
  );
}