import React from "react";
import { FiAlertTriangle, FiX, FiTrash2, FiFile, FiFolder } from "react-icons/fi";

const DeleteConfirmationModal = ({ 
  show, 
  itemType, 
  itemName, 
  onConfirm, 
  onCancel 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onCancel}>
      <div 
        className="relative bg-white rounded-xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-full bg-red-100">
            <FiAlertTriangle className="text-red-600 text-2xl" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              ยกเลิกการแชร์{itemType === "โฟลเดอร์" ? "โฟลเดอร์" : "ไฟล์"}
            </h2>
            <p className="text-gray-600 text-sm">
              คุณกำลังจะยกเลิกการแชร์ {itemType.toLowerCase()}นี้
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
            <div className="p-2 rounded-lg bg-gray-100">
              {itemType === "โฟลเดอร์" ? (
                <FiFolder className="text-emerald-600" size={24} />
              ) : (
                <FiFile className="text-emerald-600" size={24} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 truncate">{itemName}</p>
              <p className="text-sm text-gray-500">{itemType}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">
                  ข้อควรทราบ
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• คุณจะไม่สามารถเข้าถึง{itemType.toLowerCase()}นี้อีก</li>
                  <li>• การกระทำนี้ไม่สามารถยกเลิกได้</li>
                  <li>• เจ้าของ{itemType.toLowerCase()}จะไม่ได้รับแจ้งเตือน</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiTrash2 size={18} />
            ยกเลิกการแชร์
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;