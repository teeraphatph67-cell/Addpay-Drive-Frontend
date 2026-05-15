import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiFile, FiImage, FiVideo, FiMusic, FiFileText,
  FiDownload, FiEye, FiEdit, FiCopy, FiCheck,
  FiGlobe, FiUser, FiCalendar, FiLock, FiUnlock
} from "react-icons/fi";
import { API_BASE } from "../api/api.js";

export default function ShareLandingPage() {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (shareToken) {
      fetchSharedFile();
    }
  }, [shareToken]);

  const fetchSharedFile = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token"); // หรือมาจาก state/context

      const response = await fetch(`${API_BASE}/share/${shareToken}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setFileData(result.data);

        // ถ้าเป็นไฟล์รูปภาพ ให้เตรียม URL สำหรับ preview
        if (result.data.file_type?.startsWith("image/")) {
          const imageUrl = `${API_BASE}/files/${result.data.id}/preview?share_token=${shareToken}`;
          setPreviewUrl(imageUrl);
        }
      } else {
        setError(result.message || "ไม่พบไฟล์ที่แชร์");
      }
    } catch (err) {
      console.error("Error fetching shared file:", err);
      setError("เกิดข้อผิดพลาดในการโหลดไฟล์");
    } finally {
      setLoading(false);
    }
  };


  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return FiImage;
    if (fileType?.startsWith('video/')) return FiVideo;
    if (fileType?.startsWith('audio/')) return FiMusic;
    if (fileType === 'application/pdf') return FiFileText;
    return FiFile;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (item) => {
    // item ในที่นี้ควรเป็น Object ไฟล์จากใน list (items)
    // ซึ่งจาก JSON ของคุณ ID ไฟล์จะอยู่ที่ item.data.id
    const fileId = item.data?.id || item.id;

    if (!fileId) {
      alert("ไม่พบรหัสไฟล์");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // เปลี่ยน URL ให้ตรงกับที่ Backend ต้องการ (อิงจาก curl ที่คุณให้มา)
      const downloadUrl = `${API_BASE}/shared/file/${fileId}/download`;

      console.log("กำลังดาวน์โหลดไฟล์ ID:", fileId);

      const res = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/octet-stream",
        },
      });

      if (res.status === 404) {
        throw new Error(`ไม่พบไฟล์รหัส ${fileId} บนเซิร์ฟเวอร์ (404)`);
      }

      if (!res.ok) throw new Error("ดาวน์โหลดไม่สำเร็จ");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.data?.name || "download"; // ชื่อไฟล์ Hanni_OLENS_2.jpg
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Download Error:", err);
      alert(err.message);
    }
  };



  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ไม่สามารถเข้าถึงได้</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  if (!fileData) {
    return null;
  }

  const FileIcon = getFileIcon(fileData.file_type);
  const isImage = fileData.file_type?.startsWith('image/');
  const isOwner = fileData.is_owner;
  const canDownload = fileData.permissions?.can_download;
  const canEdit = fileData.permissions?.can_edit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiGlobe className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">แชร์ไฟล์</h1>
              <p className="text-sm text-gray-500">ลิงก์สาธารณะ</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
              {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - File Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* File Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-xl">
                <FileIcon size={32} className="text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-800 truncate mb-2">
                  {fileData.file_name}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <FiFile size={16} />
                    <span>{formatFileSize(fileData.file_size || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar size={16} />
                    <span>อัปเดตเมื่อ {formatDate(fileData.updated_at)}</span>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <FiUser size={16} className="text-green-600" />
                      <span className="text-green-600">เจ้าของไฟล์</span>
                    </div>
                  )}
                </div>

                {/* Permissions Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                    <FiEye size={14} />
                    <span>ดูได้</span>
                  </div>
                  {canEdit && (
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                      <FiEdit size={14} />
                      <span>แก้ไขได้</span>
                    </div>
                  )}
                  {canDownload && (
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                      <FiDownload size={14} />
                      <span>ดาวน์โหลดได้</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">ประเภทไฟล์</div>
                  <div className="font-medium">{fileData.file_type || 'ไม่ทราบ'}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">ผู้แชร์</div>
                  <div className="font-medium">{fileData.owner_name || 'ไม่ระบุ'}</div>
                </div>
              </div>

              {fileData.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">คำอธิบาย</div>
                  <p className="text-gray-700">{fileData.description}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              {canDownload && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                  <FiDownload size={18} />
                  ดาวน์โหลดไฟล์
                </button>
              )}

              {isImage && previewUrl && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <FiEye size={18} />
                  ดูรูปภาพ
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">ตัวอย่างไฟล์</h2>
              <p className="text-gray-600 text-sm">
                {isImage
                  ? 'ไฟล์รูปภาพสามารถดูตัวอย่างได้ด้านล่าง'
                  : 'ดูข้อมูลไฟล์และดาวน์โหลดได้จากปุ่มด้านข้าง'}
              </p>
            </div>

            {isImage && previewUrl ? (
              <div className="relative">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt={fileData.file_name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-gray-500">
                          <div class="text-center">
                            <FiImage size={48} class="mx-auto mb-2 opacity-50" />
                            <span>ไม่สามารถโหลดภาพได้</span>
                          </div>
                        </div>
                      `;
                    }}
                  />
                </div>

                <div className="mt-4 text-sm text-gray-500 text-center">
                  คลิกที่ปุ่ม "ดูรูปภาพ" เพื่อดูภาพเต็ม
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <FileIcon size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">ไม่มีตัวอย่างสำหรับไฟล์ประเภทนี้</p>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">ข้อมูลการแชร์</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center justify-between">
                  <span>ประเภทการแชร์:</span>
                  <span className="font-medium">สาธารณะ</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>สร้างลิงก์เมื่อ:</span>
                  <span className="font-medium">{formatDate(fileData.shared_at)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>จำนวนการเข้าชม:</span>
                  <span className="font-medium">{fileData.view_count || 0} ครั้ง</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Image Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-screen">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
            <img
              src={previewUrl}
              alt={fileData.file_name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm opacity-75">
              {fileData.file_name}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
        <span>ลิงก์นี้ถูกแชร์ผ่านระบบแชร์ไฟล์สาธารณะ</span>
        <span className="mt-1">ไฟล์นี้จะไม่พร้อมใช้งานหากผู้แชร์ลบหรือยกเลิกการแชร์</span>
      </footer>
    </div>
  );
}