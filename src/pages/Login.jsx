import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google"; 
import { useNavigate, Link } from "react-router-dom"; 
import { API_BASE } from "../api/api.js"; 
import logo from "../assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  
  // ใช้ชื่อ state ว่า inputValue เพื่อให้สื่อว่ากรอกได้ทั้ง Email หรือ Username
  const [inputValue, setInputValue] = useState("");
  const [password, setPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // เช็ค Session หมดอายุ
  useEffect(() => {
    const expired = sessionStorage.getItem("session_expired");
    if (expired) {
      setIsExpired(true);
      sessionStorage.removeItem("session_expired");
    }
  }, []);

  // เช็ค Token (ถ้ามีแล้วข้ามไปหน้า mydrive)
  useEffect(() => {
    const token = localStorage.getItem("api_token");
    if (token) {
      navigate("/mydrive", { replace: true });
    }
  }, [navigate]);

  // --- ฟังก์ชันล็อกอิน ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      // --- แก้ไขตรงนี้ตาม API ที่ให้มา ---
      // เปลี่ยน key เป็น "login" และใส่ค่า input ลงไป
      const raw = JSON.stringify({
        "login": inputValue, 
        "password": password
      });

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };

      // ยิงไปที่ API_BASE + /login 
      // (API_BASE น่าจะเป็น .../public/api/v1 ตาม config ก่อนหน้า)
      const res = await fetch(`${API_BASE}/login`, requestOptions);
      
      // แปลงเป็น JSON เพื่อเอา token
      const data = await res.json();

      if (res.ok) {
        // บันทึก Token
        localStorage.setItem("api_token", data.token || data.access_token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("login_timestamp", new Date().getTime().toString());

        setIsSuccess(true);
        setMessage("เข้าสู่ระบบสำเร็จ กำลังพาคุณไป...");
        
        setTimeout(() => navigate("/mydrive"), 1500);
      } else {
        setMessage(data.message || "Login หรือ Password ไม่ถูกต้อง");
        setIsSuccess(false);
      }
    } catch (err) {
      console.log(err);
      setMessage("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ฟังก์ชันล็อกอินด้วย Google ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setMessage("");
    
    try {
      const res = await fetch(`${API_BASE}/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("api_token", data.token || data.access_token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("login_timestamp", new Date().getTime().toString());
        
        setIsSuccess(true);
        navigate("/mydrive");
      } else {
         setMessage("การล็อกอินด้วย Google ล้มเหลว");
         setIsSuccess(false);
      }
    } catch (err) {
      console.log(err);
      setMessage("การเชื่อมต่อ Google มีปัญหา");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans relative overflow-hidden">

      {/* --- Popup แจ้งเตือนเมื่อ Session หมดเวลา --- */}
      {isExpired && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-700" />
          <div className="relative bg-white/90 backdrop-blur-md rounded-[3rem] p-1 w-full max-w-sm shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-white rounded-[2.8rem] p-10 flex flex-col items-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-200 blur-2xl opacity-40 rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-red-50 to-orange-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                  <svg className="w-12 h-12 text-red-500 animate-bounce-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">เซสชันหมดอายุ</h3>
              <p className="text-slate-500 text-base leading-relaxed mb-10 px-2">
                เพื่อความปลอดภัย <br />
                <span className="font-medium text-slate-600">กรุณาเข้าสู่ระบบใหม่อีกครั้ง</span>
              </p>
              <button
                onClick={() => {
                  localStorage.clear();
                  setIsExpired(false);
                  navigate("/login", { replace: true });
                }}
                className="group relative w-full py-5 bg-slate-900 overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-white font-bold text-lg tracking-wide flex items-center justify-center gap-2">
                  เข้าสู่ระบบใหม่
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-cyan-100 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6">
        
        {/* --- Card สีขาว --- */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 p-10">

          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 mb-6 shadow-sm">
              <img src={logo} alt="AddPay" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              ADDPAY <span className="text-blue-600">SERVICE</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">เข้าสู่ระบบเพื่อจัดการบริการของคุณ</p>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm text-center font-medium animate-in fade-in zoom-in duration-300 ${isSuccess ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          {/* Form Login (Login Field) */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2 ml-1 uppercase tracking-widest">
                Email หรือ Username
              </label>
              <input
                type="text" 
                placeholder="กรอกอีเมล หรือ ชื่อผู้ใช้งาน"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-widest">
                  รหัสผ่าน
                </label>
                {/* <button type="button" className="text-blue-600 hover:text-blue-700 text-xs font-semibold">
                  ลืมรหัสผ่าน?
                </button> */}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Social Login (Google) */}
          {/* <div className="mt-8">
            <div className="relative mb-8 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <span className="relative px-4 bg-white text-slate-400 text-xs uppercase tracking-widest">หรือเข้าสู่ระบบด้วย</span>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setMessage("Login Failed")}
                theme="outline"
                shape="pill"
                size="large"
              />
            </div>
          </div> */}

        </div> 
        {/* --- จบ Card สีขาว --- */}

        {/* --- ส่วนสมัครสมาชิก --- */}
        {/* <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm font-medium">
            ยังไม่มีบัญชีใช่ไหม?{" "}
            <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors ml-1">
                สมัครสมาชิก
            </Link>
            </p>
        </div> */}

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-[11px] font-medium opacity-70">
            © 2026 ADDPAY SERVICE CO., LTD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  );
}