// api/share.js
import { API_BASE } from './api.js';

export const shareApi = {
  // ใช้ shareToken ไม่ใช่ file ID
  getSharedFile: async (shareToken) => {
    try {
      const response = await fetch(`${API_BASE}/share/${shareToken}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response");
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching shared file:', error);
      throw error;
    }
  },

  // ดาวน์โหลดไฟล์ด้วย shareToken
  downloadSharedFile: async (fileId, shareToken) => {
    try {
      const response = await fetch(
        `${API_BASE}/files/${fileId}/download?share_token=${shareToken}`,
        {
          headers: {
            'Accept': 'application/octet-stream'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      return response;
    } catch (error) {
      console.error('Error downloading shared file:', error);
      throw error;
    }
  },

  // ดึงภาพ preview ด้วย shareToken
  getFilePreview: async (fileId, shareToken) => {
    try {
      const response = await fetch(
        `${API_BASE}/files/${fileId}/preview?share_token=${shareToken}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching preview:', error);
      throw error;
    }
  },

  // ตรวจสอบว่า API endpoint ทำงานหรือไม่
  checkApiHealth: async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
};