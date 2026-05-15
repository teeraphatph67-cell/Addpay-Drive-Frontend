import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SESSION_LIMIT = 120 * 60 * 1000; 

export default function SessionWatcher() {
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem("api_token");
            const loginTime = localStorage.getItem("login_timestamp");

            // ถ้าไม่มี token หรือ loginTime ก็ไม่ต้องทำอะไร
            if (!token || !loginTime) return;

            const currentTime = Date.now();
            const loginTimestamp = Number(loginTime);
            const elapsedTime = currentTime - loginTimestamp;

            // ถ้าเกินเวลาที่กำหนด (10 นาที)
            if (elapsedTime >= SESSION_LIMIT) {
                // เตรียมเก็บข้อมูลบางอย่างก่อนล้าง
                const shareRedirectToken = localStorage.getItem("share_redirect_token");
                const shareRedirectPath = localStorage.getItem("share_redirect_path");
                
                // ล้าง storage
                localStorage.clear();
                sessionStorage.clear();
                
                // บันทึกสถานะ session หมดอายุ
                sessionStorage.setItem("session_expired", "true");
                
                // คืนค่าบางข้อมูลที่อาจจำเป็น
                if (shareRedirectToken && shareRedirectPath) {
                    localStorage.setItem("share_redirect_token", shareRedirectToken);
                    localStorage.setItem("share_redirect_path", shareRedirectPath);
                }
                
                // นำทางไปหน้า login พร้อมแสดงข้อความ
                navigate("/login", { 
                    replace: true,
                    state: { 
                        sessionExpired: true,
                        message: "เซสชันหมดอายุเพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
                    }
                });
            }

        }, 30 * 1000); // ตรวจสอบทุก 30 วินาที (ลดจากทุก 1 วินาที)

        return () => clearInterval(interval);
    }, [navigate]);

    return null;
}