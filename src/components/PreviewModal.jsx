// src/components/PreviewModal.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  FiX,
  FiDownload,
  FiExternalLink,
  FiFile,
  FiImage,
  FiFileText,
  FiFilm,
  FiMusic,
  FiFile as FiDocFile,
  FiVideo,
  FiHeadphones,
  FiFileMinus,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiRefreshCw,
  FiClock,
} from "react-icons/fi";
import { API_BASE, BASE_URL } from "../api/api.js";
import {
  FaFileExcel,
  FaFileWord,
  FaFilePowerpoint,
  FaFilePdf,
  FaFileArchive,
  FaSpinner,
} from "react-icons/fa";
import { MdErrorOutline, MdDownloading, MdInfoOutline } from "react-icons/md";
import { TbFileAlert } from "react-icons/tb";

const PreviewModal = ({ show, file, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileSrc, setFileSrc] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [videoRetryCount, setVideoRetryCount] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isDirectDownload, setIsDirectDownload] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const token = localStorage.getItem("api_token");
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
    gray: "bg-gray-100 text-gray-600",
  };

  // ฟังก์ชันตรวจสอบประเภทไฟล์
  const getFileTypeInfo = useCallback((file) => {
    if (!file)
      return {
        type: "unknown",
        icon: <FiFileMinus className="text-4xl text-gray-500" />,
        name: "ไฟล์ทั่วไป",
        color: "gray",
        canPreview: false,
      };

    const mimeType = (file.file_type || file.mime_type || "").toLowerCase();
    const fileName = (file.file_name || file.name || "").toLowerCase();
    const fileExt = fileName.split(".").pop() || "";

    console.log("🔍 File type analysis:", { mimeType, fileName, fileExt });

    // ตรวจสอบประเภทไฟล์
    // 1. ภาพ
    if (
      mimeType.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|bmp|webp|svg|jfif|ico|tiff|tif)$/i.test(fileName)
    ) {
      return {
        type: "image",
        icon: <FiImage className="text-4xl text-blue-500" />,
        name: "รูปภาพ",
        color: "blue",
        canPreview: true,
      };
    }

    // 2. PDF
    if (mimeType.includes("pdf") || /\.(pdf)$/i.test(fileName)) {
      return {
        type: "pdf",
        icon: <FaFilePdf className="text-4xl text-red-500" />,
        name: "ไฟล์ PDF",
        color: "red",
        canPreview: true,
      };
    }

    // 3. วิดีโอ (เพิ่ม support สำหรับหลาย format)
    if (
      mimeType.startsWith("video/") ||
      /\.(mp4|mov|avi|wmv|flv|mkv|webm|m4v|mpg|mpeg|3gp|ts|mts|m2ts|qt|f4v|ogv|ogg|mxf|rm|rmvb|asf)$/i.test(
        fileName,
      )
    ) {
      let supported = true;
      let needsTranscoding = false;

      // ตรวจสอบว่าเบราว์เซอร์รองรับ format นี้หรือไม่
      const video = document.createElement("video");
      const canPlay = video.canPlayType(mimeType || "video/mp4");

      if (canPlay === "probably" || canPlay === "maybe") {
        supported = true;
      } else if (/\.(mov|qt|avi|wmv|flv|rm|rmvb|asf)$/i.test(fileName)) {
        supported = false;
        needsTranscoding = true;
      }

      return {
        type: "video",
        icon: <FiVideo className="text-4xl text-purple-500" />,
        name: "วิดีโอ",
        color: "purple",
        canPreview: true,
        supported,
        needsTranscoding,
        mimeType: mimeType,
      };
    }

    // 4. เสียง
    if (
      mimeType.startsWith("audio/") ||
      /\.(mp3|wav|ogg|m4a|aac|flac|wma|aiff|opus|mka|weba)$/i.test(fileName)
    ) {
      return {
        type: "audio",
        icon: <FiHeadphones className="text-4xl text-green-500" />,
        name: "ไฟล์เสียง",
        color: "green",
        canPreview: true,
      };
    }

    // 5. ข้อความ
    if (
      mimeType.startsWith("text/") ||
      /\.(txt|md|json|js|jsx|ts|tsx|html|css|xml|yml|yaml|csv|ini|conf|log|php|py|java|c|cpp|h|hpp|sh|bat)$/i.test(
        fileName,
      )
    ) {
      return {
        type: "text",
        icon: <FiFileText className="text-4xl text-gray-600" />,
        name: "ไฟล์ข้อความ",
        color: "gray",
        canPreview: true,
      };
    }

    // 6. Word
    if (
      mimeType.includes("word") ||
      /\.(doc|docx|dot|dotx|docm|dotm|rtf|odt)$/i.test(fileName)
    ) {
      return {
        type: "document",
        icon: <FaFileWord className="text-4xl text-blue-600" />,
        name: "เอกสาร Word",
        color: "blue",
        canPreview: true,
      };
    }

    // 7. Excel
    if (
      mimeType.includes("excel") ||
      /\.(xls|xlsx|xlsm|xlsb|xlt|xltx|xltm|ods|csv)$/i.test(fileName)
    ) {
      return {
        type: "spreadsheet",
        icon: <FaFileExcel className="text-4xl text-green-600" />,
        name: "เอกสาร Excel",
        color: "green",
        canPreview: true,
      };
    }

    // 8. PowerPoint
    if (
      mimeType.includes("powerpoint") ||
      /\.(ppt|pptx|pps|ppsx|pot|potx|pptm|potm|odp)$/i.test(fileName)
    ) {
      return {
        type: "presentation",
        icon: <FaFilePowerpoint className="text-4xl text-orange-600" />,
        name: "เอกสาร PowerPoint",
        color: "orange",
        canPreview: true,
      };
    }

    // 9. ZIP/Archive
    if (
      mimeType.includes("zip") ||
      mimeType.includes("archive") ||
      /\.(zip|rar|7z|tar|gz|bz2|xz|z|tgz|tbz2|txz)$/i.test(fileName)
    ) {
      return {
        type: "archive",
        icon: <FaFileArchive className="text-4xl text-yellow-600" />,
        name: "ไฟล์บีบอัด",
        color: "yellow",
        canPreview: false,
      };
    }

    // 10. อื่นๆ
    return {
      type: "unknown",
      icon: <FiFile className="text-4xl text-gray-500" />,
      name: "ไฟล์ทั่วไป",
      color: "gray",
      canPreview: false,
    };
  }, []);

  // ฟังก์ชันสร้าง Blob URL จากไฟล์
  const createBlobUrl = async (url) => {
    try {
      console.log("🔄 Creating blob from URL:", url);

      const token = localStorage.getItem("api_token");
      const headers = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      headers["Accept"] = "video/*,application/octet-stream,*/*";

      const response = await fetch(url, {
        headers,
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const totalSize = response.headers.get("content-length");
      const reader = response.body.getReader();
      let receivedLength = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        chunks.push(value);
        receivedLength += value.length;

        if (totalSize) {
          const progress = Math.round((receivedLength / totalSize) * 100);
          setDownloadProgress(progress);
        }
      }

      const blob = new Blob(chunks);
      console.log("📦 Blob created:", {
        size: blob.size,
        type: blob.type,
        url: url,
      });

      // สำหรับไฟล์ .mov ให้ปรับ MIME type
      let blobType = blob.type;
      if (!blobType || blobType === "application/octet-stream") {
        if (url.toLowerCase().endsWith(".mov")) {
          blobType = "video/quicktime";
        } else if (url.toLowerCase().endsWith(".avi")) {
          blobType = "video/x-msvideo";
        } else {
          blobType = "video/mp4";
        }
      }

      const videoBlob = new Blob([blob], { type: blobType });
      const blobUrl = URL.createObjectURL(videoBlob);

      console.log("✅ Blob URL created with type:", blobType);
      setDownloadProgress(100);
      return blobUrl;
    } catch (error) {
      console.error("❌ Error creating blob:", error);
      throw error;
    }
  };

  // ฟังก์ชันโหลดไฟล์
  const loadFile = useCallback(async (url, fileType) => {
    try {
      console.log("🎬 Loading file:", { url, fileType });

      // ตรวจสอบว่าเป็น blob: หรือ data: URL หรือไม่ (ใช้ตรงๆ โดยไม่ต้องเพิ่ม timestamp)
      const isBlobOrData =
        url && (url.startsWith("blob:") || url.startsWith("data:"));
      const timestamp = new Date().getTime();
      const urlWithTimestamp = isBlobOrData
        ? url
        : url.includes("?")
          ? `${url}&t=${timestamp}`
          : `${url}?t=${timestamp}`;

      if (fileType === "image") {
        // โหลดภาพ
        const img = new Image();
        img.crossOrigin = "anonymous";

        return new Promise((resolve, reject) => {
          img.onload = () => {
            console.log("✅ Image loaded successfully");
            // ถ้าเป็น blob/data ให้ส่งกลับ URL ต้นฉบับ (ไม่ต้อง query string)
            resolve(isBlobOrData ? url : urlWithTimestamp);
          };

          img.onerror = async () => {
            // ถ้าเป็น blob/data URL ให้ไม่พยายาม fetch
            if (isBlobOrData) {
              console.error(
                "❌ Failed to load blob/data URL image and cannot fallback to network fetch",
              );
              reject(new Error("Failed to load blob/data URL"));
              return;
            }

            console.log("🔄 Trying to load image with fetch...");
            try {
              const response = await fetch(urlWithTimestamp, {
                headers: localStorage.getItem("api_token")
                  ? {
                      Authorization: `Bearer ${localStorage.getItem("api_token")}`,
                    }
                  : {},
                mode: "cors",
                cache: "no-cache",
              });

              if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                console.log("✅ Image loaded via fetch");
                resolve(blobUrl);
              } else {
                reject(
                  new Error(`HTTP ${response.status}: ${response.statusText}`),
                );
              }
            } catch (fetchErr) {
              reject(fetchErr);
            }
          };

          img.src = urlWithTimestamp;
        });
      } else if (fileType === "video") {
        // สำหรับวิดีโอ ให้ใช้ Blob URL เสมอ
        console.log("🔄 Using blob approach for video");
        setDownloadProgress(0);
        // ถ้าเป็น blob/data URL ให้ใช้ตรงๆ (ไม่ต้อง fetch)
        if (isBlobOrData) {
          return url;
        }

        const blobUrl = await createBlobUrl(urlWithTimestamp);
        return blobUrl;
      } else if (fileType === "pdf") {
        // PDFs often require Authorization headers when served from the API.
        // Fetch as blob and return a blob URL so iframe can load it correctly.
        try {
          if (isBlobOrData) return url;
          setDownloadProgress(0);
          const blobUrl = await createBlobUrl(urlWithTimestamp);
          return blobUrl;
        } catch (err) {
          console.warn(
            "PDF fetch via blob failed, falling back to direct URL",
            err,
          );
          return urlWithTimestamp;
        }
      } else {
        // สำหรับไฟล์ประเภทอื่นๆ
        return urlWithTimestamp;
      }
    } catch (err) {
      console.error("❌ Error loading file:", err);
      return url.includes("?")
        ? `${url}&t=${new Date().getTime()}`
        : `${url}?t=${new Date().getTime()}`;
    }
  }, []);

  // ฟังก์ชันจัดการวิดีโอ
  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current
          .play()
          .then(() => {
            setIsVideoPlaying(true);
          })
          .catch((err) => {
            console.error("❌ Play error:", err);
            handleVideoError(err);
          });
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const handleVideoError = (error) => {
    console.error("❌ Video playback error:", error);
    setVideoError(true);

    const video = videoRef.current;
    if (video && video.error) {
      console.error("Video error details:", {
        code: video.error.code,
        message: video.error.message,
      });

      let errorMessage = "ไม่สามารถเล่นวิดีโอได้";
      switch (video.error.code) {
        case 1:
          errorMessage = "วิดีโอถูกยกเลิกระหว่างการโหลด";
          break;
        case 2:
          errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย";
          break;
        case 3:
          errorMessage = "รูปแบบวิดีโอไม่รองรับหรือไฟล์เสีย";
          break;
        case 4:
          errorMessage = "วิดีโอไม่รองรับกับโค้คตัวถอดรหัสนี้";
          break;
        default:
          errorMessage = "เกิดข้อผิดพลาดในการเล่นวิดีโอ";
      }

      setError(errorMessage);
    } else {
      setError("เกิดข้อผิดพลาดในการเล่นวิดีโอ กรุณาลองดาวน์โหลดไฟล์");
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;

      if (duration > 0) {
        setVideoProgress((currentTime / duration) * 100);
        setVideoDuration(duration);
      }
    }
  };

  const handleVideoLoadedMetadata = () => {
    console.log("✅ Video metadata loaded");
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
    setIsLoading(false);
    setVideoError(false);
  };

  const handleVideoRetry = () => {
    if (videoRetryCount < 2) {
      setIsLoading(true);
      setError(null);
      setVideoError(false);
      setVideoRetryCount((prev) => prev + 1);
      setDownloadProgress(0);

      // ล้าง blob URL เก่า
      if (fileSrc && fileSrc.startsWith("blob:")) {
        URL.revokeObjectURL(fileSrc);
      }

      // โหลดไฟล์ใหม่
      if (file) {
        loadFile(file.file_url, "video")
          .then((src) => {
            setFileSrc(src);
          })
          .catch((err) => {
            console.error("❌ Retry failed:", err);
            setError(`ไม่สามารถโหลดวิดีโอได้: ${err.message}`);
            setIsLoading(false);
          });
      }
    } else {
      // ถ้าลอง 2 ครั้งแล้วไม่สำเร็จ ให้แสดงตัวเลือกดาวน์โหลด
      setIsDirectDownload(true);
      setIsLoading(false);
    }
  };

  const handleVideoDownload = async () => {
    try {
      setIsLoading(true);
      setDownloadProgress(0);
      console.log("⬇️ Starting video download...");

      const token = localStorage.getItem("api_token");
      const headers = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(file.file_url, {
        headers,
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const totalSize = response.headers.get("content-length");
      const reader = response.body.getReader();
      let receivedLength = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        chunks.push(value);
        receivedLength += value.length;

        if (totalSize) {
          const progress = Math.round((receivedLength / totalSize) * 100);
          setDownloadProgress(progress);
        }
      }

      const blob = new Blob(chunks);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.file_name || file.name || "video.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // ล้าง blob URL หลังจากดาวน์โหลด
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
        setDownloadProgress(0);
        setIsLoading(false);
      }, 100);

      console.log("✅ Download completed");
    } catch (error) {
      console.error("❌ Download error:", error);
      setError(`ดาวน์โหลดล้มเหลว: ${error.message}`);
      setIsLoading(false);
      setDownloadProgress(0);
    }
  };

  const handleVideoFullscreen = () => {
    if (videoContainerRef.current) {
      if (!document.fullscreenElement) {
        videoContainerRef.current.requestFullscreen().catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`,
          );
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleVideoSeek = (e) => {
    if (videoRef.current && videoDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percent = x / width;
      const seekTime = percent * videoDuration;

      videoRef.current.currentTime = seekTime;
      setVideoProgress(percent * 100);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "ไม่ทราบ";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    if (show && file) {
      const fileTypeInfo = getFileTypeInfo(file);
      setFileInfo(fileTypeInfo);

      setIsLoading(true);
      setError(null);
      setFileSrc(null);
      setVideoError(false);
      setVideoRetryCount(0);
      setIsVideoPlaying(false);
      setVideoVolume(1);
      setVideoProgress(0);
      setVideoDuration(0);
      setIsDirectDownload(false);
      setDownloadProgress(0);

      // ตรวจสอบว่าไฟล์มี URL หรือไม่
      if (!file.file_url) {
        console.error("❌ No file URL provided");
        setIsLoading(false);
        setError("ไม่มีลิงก์ไฟล์สำหรับแสดงผล");
        return;
      }

      // โหลดไฟล์
      loadFile(file.file_url, fileTypeInfo.type)
        .then((src) => {
          console.log("✅ File loaded successfully:", src);
          setFileSrc(src);

          // ถ้าเป็นไฟล์วิดีโอ ให้รอสักครู่ก่อนปิด loading
          if (fileTypeInfo.type === "video") {
            setTimeout(() => {
              if (!videoRef.current?.error) {
                setIsLoading(false);
              }
            }, 1000);
          } else {
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error("❌ Failed to load file:", err);
          setError(`ไม่สามารถโหลดไฟล์ได้: ${err.message}`);
          setIsLoading(false);
        });
    }

    // Cleanup function
    return () => {
      // ล้าง blob URL เมื่อ component unmount
      if (fileSrc && fileSrc.startsWith("blob:")) {
        URL.revokeObjectURL(fileSrc);
      }

      // ล้าง interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [show, file, getFileTypeInfo, loadFile]);

  // Effect สำหรับจัดการ video events
  useEffect(() => {
    if (videoRef.current && fileInfo?.type === "video" && fileSrc) {
      const video = videoRef.current;

      const handlePlay = () => setIsVideoPlaying(true);
      const handlePause = () => setIsVideoPlaying(false);
      const handleEnded = () => setIsVideoPlaying(false);
      const handleVolumeChange = () => setVideoVolume(video.volume);
      const handleCanPlay = () => {
        console.log("✅ Video can play");
        setIsLoading(false);
        setVideoError(false);
      };

      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("volumechange", handleVolumeChange);
      video.addEventListener("timeupdate", handleVideoTimeUpdate);
      video.addEventListener("loadedmetadata", handleVideoLoadedMetadata);
      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", handleVideoError);

      // ตั้งค่า video
      video.volume = videoVolume;
      video.preload = "auto";

      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("volumechange", handleVolumeChange);
        video.removeEventListener("timeupdate", handleVideoTimeUpdate);
        video.removeEventListener("loadedmetadata", handleVideoLoadedMetadata);
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("error", handleVideoError);
      };
    }
  }, [fileInfo?.type, fileSrc, videoVolume]);

  const handleDownload = async (e = null) => {
    if (e && e.stopPropagation) e.stopPropagation();

    // ใช้ file จาก Props โดยตรง และเช็กเงื่อนไขให้ยืดหยุ่น
    if (file.allow_download === false) {
      alert("คุณไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้");
      return;
    }

    try {
      setIsLoading(true); // แสดงสถานะโหลดระหว่างเตรียมไฟล์
      const permissionId = file.permission_id || file.id; // Fallback ไปใช้ id ถ้าไม่มี permission_id

      // ตรวจสอบว่าเป็น Folder หรือ File
      const isFolder = file.is_folder || !file.file_url;
      const endpoint = isFolder
        ? `${API_BASE}/shared/folder/${permissionId}/download-zip`
        : `${API_BASE}/shared/file/${permissionId}/download`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = file.file_name || file.name || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsLoading(false);
    } catch (err) {
      console.error("Download error:", err);
      alert(`ดาวน์โหลดไม่สำเร็จ: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (file.file_url) {
      window.open(file.file_url, "_blank", "noopener,noreferrer");
    } else {
      alert("ไม่มีลิงก์สำหรับเปิด");
    }
  };

  if (!show || !file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 md:p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          {/* Header สำหรับมือถือและ Desktop */}
          <div className="flex items-start justify-between gap-3">
            {/* Left Section - ชื่อไฟล์และข้อมูล */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Icon */}
              <div
                className={`p-2.5 md:p-3 rounded-lg shrink-0 ${colorMap[fileInfo?.color] || colorMap.gray}`}
              >
                {fileInfo?.icon}
              </div>

              {/* File Info - ใช้ min-w-0 และ flex-1 เพื่อป้องกัน overflow */}
              <div className="min-w-0 flex-1">
                {/* ชื่อไฟล์กับปุ่มกากบาทในแถวเดียวกัน */}
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base md:text-xl font-bold text-gray-900 truncate pr-2">
                    {file.file_name || file.name || "ไฟล์"}
                  </h2>

                  {/* ปุ่มกากบาทสำหรับมือถือและ desktop */}
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="shrink-0 p-2 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 md:hidden"
                    title="ปิด"
                  >
                    <FiX size={20} className="text-gray-700" />
                  </button>
                </div>

                {/* Metadata ด้านล่าง */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs md:text-sm font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    {fileInfo?.name}
                  </span>

                  <span className="text-xs md:text-sm text-gray-500">
                    {formatFileSize((file?.size_mb || 0) * 1024 * 1024)}
                  </span>

                  {fileInfo?.type === "video" && !fileInfo?.supported && (
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      อาจต้องดาวน์โหลด
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - ปุ่มต่างๆ สำหรับ Desktop */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {file.file_url && (
                <>
                  <button
                    onClick={handleOpenInNewTab}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-sm disabled:opacity-50"
                  >
                    <FiExternalLink size={16} />
                    เปิดใหม่
                  </button>

                  {/* <button
                    onClick={(e) => handleDownload(e)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FiDownload />
                    )}
                    ดาวน์โหลด
                  </button> */}
                </>
              )}

              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex items-center justify-center p-2.5 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                title="ปิด"
              >
                <FiX size={22} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* ปุ่มสำหรับมือถือ */}
          {file.file_url && (
            <div className="flex gap-2 md:hidden">
              <button
                onClick={handleOpenInNewTab}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-sm disabled:opacity-50"
              >
                <FiExternalLink size={16} />
                เปิดใหม่
              </button>

              <button
                onClick={(e) => handleDownload(e)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FiDownload />
                )}
                ดาวน์โหลด
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-auto max-h-[calc(95vh-180px)]">
          {isLoading && downloadProgress > 0 && downloadProgress < 100 ? (
            <div className="flex flex-col justify-center items-center h-80">
              <div className="relative w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-8">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
              <span className="text-lg font-medium text-gray-700 mb-2">
                กำลังโหลดไฟล์... {downloadProgress}%
              </span>
              <span className="text-sm text-gray-500">
                กรุณารอสักครู่ ไฟล์กำลังถูกดาวน์โหลดเพื่อเตรียมเล่น
              </span>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col justify-center items-center h-80">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-500 mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <span className="text-lg font-medium text-gray-700 mt-4">
                กำลังเตรียมไฟล์...
              </span>
              {fileInfo?.type === "video" && fileSrc && (
                <div className="space-y-4">
                  <div
                    ref={videoContainerRef}
                    className="relative h-[60vh] rounded-xl overflow-hidden shadow-xl bg-black group"
                  >
                    {isDirectDownload ? (
                      <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
                        <MdDownloading className="text-6xl mb-4 text-yellow-500" />
                        <h3 className="text-xl font-bold mb-2">
                          รูปแบบวิดีโอไม่รองรับการเล่นสด
                        </h3>
                        <button
                          onClick={handleDownload}
                          className="px-6 py-2 bg-blue-600 rounded-lg"
                        >
                          ดาวน์โหลดเพื่อดู
                        </button>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        controls
                        className="w-full h-full"
                        src={fileSrc}
                        onLoadedMetadata={() => setIsLoading(false)}
                        onError={handleVideoError}
                      />
                    )}
                  </div>

                  {/* ส่วนแสดงข้อมูลเพิ่มเติมใต้คลิป */}
                  <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FiClock />{" "}
                      <span>อัปเดตเมื่อ: {formatDate(file.updated_at)}</span>
                    </div>
                    <div className="text-sm font-mono text-gray-400">
                      ID: {file.permission_id || file.id}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <TbFileAlert className="text-red-500 text-6xl mb-6 mx-auto" />
              <span className="text-red-500 text-xl font-medium mb-3 block">
                {error.includes("ไม่สามารถเล่นวิดีโอได้")
                  ? "ไม่สามารถเล่นวิดีโอได้"
                  : error}
              </span>
              <span className="text-gray-600 mb-6 block">
                {error.includes("ไม่สามารถเล่นวิดีโอได้")
                  ? "กรุณาดาวน์โหลดไฟล์เพื่อเปิดดูในโปรแกรมเล่นวิดีโอ"
                  : "กรุณาตรวจสอบลิงก์ไฟล์หรือลองอีกครั้ง"}
              </span>

              {file.file_url && (
                <div className="text-left bg-gray-100 p-4 rounded-lg text-sm font-mono break-all mb-6 max-w-2xl mx-auto">
                  <strong className="text-gray-800">ลิงก์ไฟล์:</strong>
                  <br />
                  <span className="text-blue-600">{file.file_url}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center mt-6">
                {fileInfo?.type === "video" && videoRetryCount < 2 && (
                  <button
                    onClick={handleVideoRetry}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2"
                  >
                    <FiRefreshCw />
                    ลองเล่นอีกครั้ง ({videoRetryCount + 1}/2)
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium flex items-center gap-2"
                >
                  <FiDownload />
                  ดาวน์โหลดไฟล์
                </button>
              </div>
            </div>
          ) : fileInfo?.type === "image" && fileSrc ? (
            <div className="flex justify-center items-center">
              <img
                src={fileSrc}
                alt={file.file_name || file.name}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                onLoad={() => console.log("✅ Image displayed successfully")}
                onError={(e) => {
                  console.error("❌ Final image display error:", e);
                  setError("ไม่สามารถแสดงรูปภาพได้");
                }}
              />
            </div>
          ) : fileInfo?.type === "pdf" && fileSrc ? (
            <div className="h-[70vh] rounded-xl overflow-hidden shadow-xl">
              <iframe
                src={fileSrc}
                title={file.file_name}
                className="w-full h-full border-0"
                onLoad={() => console.log("✅ PDF loaded")}
                onError={() => {
                  console.error("❌ PDF load error");
                  setError("ไม่สามารถแสดงไฟล์ PDF ได้");
                }}
              />
            </div>
          ) : fileInfo?.type === "video" && fileSrc ? (
            <div className="space-y-4">
              <div
                ref={videoContainerRef}
                className="relative h-[60vh] rounded-xl overflow-hidden shadow-xl bg-black group"
              >
                {isDirectDownload ? (
                  <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
                    <MdDownloading className="text-6xl mb-4 text-yellow-500" />
                    <h3 className="text-xl font-bold mb-2">
                      ไม่สามารถเล่นวิดีโอได้โดยตรง
                    </h3>
                    <p className="text-gray-300 mb-6">
                      ไฟล์วิดีโอมีรูปแบบที่ไม่รองรับการเล่นในเบราว์เซอร์นี้
                      กรุณาดาวน์โหลดไฟล์และเปิดด้วยโปรแกรมเล่นวิดีโอ
                    </p>
                    <button
                      onClick={handleVideoDownload}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white font-bold flex items-center gap-2"
                    >
                      <FiDownload />
                      ดาวน์โหลดวิดีโอเพื่อเปิด
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      controls={!videoError}
                      playsInline
                      preload="auto"
                      className="w-full h-full object-contain"
                      poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxRDFFMUUiLz4KPHBhdGggZD0iTTQwIDM1TDU1IDUwTDQwIDY1VjM1WiIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K"
                    >
                      <source
                        src={fileSrc}
                        type={file.file_type || "video/mp4"}
                      />
                      <source src={fileSrc} type="video/quicktime" />
                      <source src={fileSrc} type="video/webm" />
                      บราวเซอร์ของคุณไม่สนับสนุนการเล่นวิดีโอนี้
                    </video>

                    {/* Custom video controls */}
                    {!videoError && (
                      <div>
                        {/* Progress bar */}
                        <div
                          className="relative h-1.5 bg-gray-600 mb-4 cursor-pointer rounded-full overflow-hidden"
                          onClick={handleVideoSeek}
                        >
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-green-500"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Play/Pause button */}
                            <button
                              onClick={handleVideoPlay}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                            >
                              {isVideoPlaying ? (
                                <FiPause size={20} />
                              ) : (
                                <FiPlay size={20} />
                              )}
                            </button>

                            {/* Time display */}
                            <div className="text-white text-sm font-mono flex items-center gap-1">
                              <FiClock size={12} />
                              <span>
                                {formatTime(videoRef.current?.currentTime || 0)}{" "}
                                / {formatTime(videoDuration)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {/* Volume control */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  if (videoRef.current) {
                                    videoRef.current.volume =
                                      videoVolume > 0 ? 0 : 1;
                                    setVideoVolume(videoRef.current.volume);
                                  }
                                }}
                                className="p-1 text-white hover:text-gray-300"
                              >
                                {videoVolume === 0 ? (
                                  <FiVolumeX size={18} />
                                ) : (
                                  <FiVolume2 size={18} />
                                )}
                              </button>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={videoVolume}
                                onChange={(e) => {
                                  const vol = parseFloat(e.target.value);
                                  setVideoVolume(vol);
                                  if (videoRef.current) {
                                    videoRef.current.volume = vol;
                                  }
                                }}
                                className="w-20 accent-white"
                              />
                            </div>

                            {/* Fullscreen button */}
                            <button
                              onClick={handleVideoFullscreen}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded text-white text-sm transition-colors"
                            >
                              เต็มจอ
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loading overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
                          <p className="text-white font-medium">
                            กำลังเตรียมวิดีโอ...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error overlay */}
                    {videoError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6">
                        <MdErrorOutline className="text-red-500 text-6xl mb-4" />
                        <p className="text-white text-xl font-medium mb-2">
                          เกิดข้อผิดพลาด
                        </p>
                        <p className="text-gray-300 text-center mb-6 max-w-lg">
                          {error ||
                            "ไม่สามารถเล่นวิดีโอได้ กรุณาดาวน์โหลดไฟล์เพื่อเปิดดู"}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                          {videoRetryCount < 2 && (
                            <button
                              onClick={handleVideoRetry}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2"
                            >
                              <FiRefreshCw />
                              ลองเล่นอีกครั้ง ({videoRetryCount + 1}/2)
                            </button>
                          )}
                          <button
                            onClick={handleVideoDownload}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium flex items-center gap-2"
                          >
                            <FiDownload />
                            ดาวน์โหลดวิดีโอ
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Video info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MdInfoOutline />
                      ข้อมูลไฟล์
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex">
                        <span className="text-gray-600 w-28">ชื่อไฟล์:</span>
                        <span className="font-medium truncate">
                          {file.file_name || file.name}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-28">รูปแบบ:</span>
                        <span className="font-medium">
                          {file.file_type || "video/quicktime"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-28">ขนาด:</span>
                        <span className="font-medium">
                          {formatFileSize(file.size_mb * 1024 * 1024)}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-28">สถานะ:</span>
                        <span
                          className={`font-medium ${videoError ? "text-red-600" : "text-green-600"}`}
                        >
                          {videoError ? "เล่นไม่ได้" : "พร้อมเล่น"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">คำแนะนำ</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      หากวิดีโอไม่สามารถเล่นได้ในเบราว์เซอร์นี้
                      กรุณาดาวน์โหลดไฟล์และเปิดด้วยโปรแกรมต่อไปนี้:
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
                        VLC Media Player
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
                        Windows Media Player
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
                        QuickTime Player
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
                        PotPlayer
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : fileInfo?.type === "audio" && fileSrc ? (
            <div className="flex flex-col items-center justify-center h-80">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-12 rounded-full mb-8 shadow-lg">
                <FiHeadphones className="text-7xl text-green-500" />
              </div>
              <div className="w-full max-w-2xl">
                <audio
                  controls
                  autoPlay
                  className="w-full h-16"
                  onLoadedData={() => console.log("✅ Audio loaded")}
                  onError={() => {
                    console.error("❌ Audio load error");
                    setError("ไม่สามารถเล่นไฟล์เสียงได้");
                  }}
                >
                  <source src={fileSrc} type={file.file_type || "audio/mpeg"} />
                  <source src={fileSrc} type="audio/wav" />
                  บราวเซอร์ของคุณไม่สนับสนุนการเล่นไฟล์เสียงนี้
                </audio>
              </div>
              <div className="mt-8 text-center">
                <p className="text-lg font-medium text-gray-700">
                  {file.file_name}
                </p>
                <p className="text-gray-500">{fileInfo?.name}</p>
              </div>
            </div>
          ) : fileInfo?.type === "text" && fileSrc ? (
            <div className="h-[70vh] rounded-xl overflow-hidden shadow-xl">
              <iframe
                src={fileSrc}
                title={file.file_name}
                className="w-full h-full border-0 bg-white"
                onLoad={() => console.log("✅ Text file loaded")}
                onError={() => {
                  console.error("❌ Text file load error");
                  setError("ไม่สามารถแสดงไฟล์ข้อความได้");
                }}
              />
            </div>
          ) : ["document", "spreadsheet", "presentation"].includes(
              fileInfo?.type,
            ) && fileSrc ? (
            <div className="h-[70vh] rounded-xl overflow-hidden shadow-xl">
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.file_url)}`}
                title={file.file_name}
                className="w-full h-full border-0"
                onLoad={() => console.log("✅ Office document loaded")}
                onError={() => {
                  console.error("❌ Office document load error");
                  setError("ไม่สามารถแสดงไฟล์เอกสารได้");
                }}
              />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-8 shadow-lg">
                <div className="text-7xl mb-4">📄</div>
              </div>
              <span className="text-2xl font-bold text-gray-800 mb-4 block">
                ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้
              </span>
              <span className="text-gray-600 mb-8 block max-w-2xl mx-auto">
                ไฟล์ประเภทนี้ต้องดาวน์โหลดเพื่อเปิดใช้งาน
              </span>

              <div className="inline-flex flex-col gap-4 text-left bg-gray-50 p-6 rounded-xl shadow-md mb-8 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-gray-700">ชื่อไฟล์:</strong>
                  </div>
                  <div className="text-gray-900 font-medium">
                    {file.file_name || file.name}
                  </div>

                  <div>
                    <strong className="text-gray-700">ประเภท:</strong>
                  </div>
                  <div className="text-gray-900">
                    {file.file_type || file.mime_type || "ไม่ทราบ"}
                  </div>

                  <div>
                    <strong className="text-gray-700">ขนาด:</strong>
                  </div>
                  <div className="text-gray-900">
                    {formatFileSize(file.size_mb * 1024 * 1024)}
                  </div>

                  <div>
                    <strong className="text-gray-700">อัปเดตล่าสุด:</strong>
                  </div>
                  <div className="text-gray-900">
                    {formatDate(file.updated_at || file.created_at)}
                  </div>
                </div>

                {file.file_url && (
                  <div className="mt-4 pt-4 border-t">
                    <strong className="text-gray-700 block mb-2">
                      ลิงก์ไฟล์:
                    </strong>
                    <div className="text-sm font-mono break-all bg-gray-100 p-3 rounded-lg text-blue-600">
                      {file.file_url}
                    </div>
                  </div>
                )}
              </div>

              {file.file_url && (
                <button
                  onClick={handleDownload}
                  className="mt-4 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
                >
                  <FiDownload className="inline mr-3" />
                  ดาวน์โหลดไฟล์
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">สถานะ:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${error || videoError ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
              >
                {error || videoError ? "เล่นไม่ได้" : "พร้อมใช้งาน"}
              </span>
              {videoRetryCount > 0 && (
                <span className="text-xs text-gray-500">
                  (ลองแล้ว {videoRetryCount} ครั้ง)
                </span>
              )}
            </div>
            <div>
              <span className="font-medium text-gray-700">ประเภทไฟล์:</span>{" "}
              <span className="text-gray-900">
                {file.file_type || file.mime_type || "ไม่ระบุ"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">อัปเดตล่าสุด:</span>{" "}
              <span className="text-gray-900">
                {formatDate(file.updated_at || file.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
