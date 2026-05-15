import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png"; // ตรวจสอบ path นี้ให้ถูกต้อง
import { FiUser, FiCamera, FiPlus } from "react-icons/fi";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // State สำหรับจัดการรูปภาพ
  const [avatarFile, setAvatarFile] = useState(null); // เก็บไฟล์ที่จะส่ง API
  const [avatarPreview, setAvatarPreview] = useState(null); // เก็บ URL เพื่อพรีวิว

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // ตรวจสอบ Token
  useEffect(() => {
    const token = localStorage.getItem("api_token");
    if (token) {
      navigate("/mydrive", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- ฟังก์ชันเมื่อมีการเลือกไฟล์รูปภาพ ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // สร้าง URL จำลองเพื่อแสดงผลทันที
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // --- ฟังก์ชันสร้าง Default Avatar (กรณีไม่ได้อัปโหลดรูป) ---
  

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // 1. Validation รหัสผ่าน
    if (formData.password !== formData.confirmPassword) {
      setMessage("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      setIsLoading(false);
      return;
    }

    try {
      // 2. เตรียมข้อมูลแบบ FormData (ตาม API ใหม่)
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name);
      dataToSend.append("email", formData.email);
      dataToSend.append("username", formData.username);
      dataToSend.append("password", formData.password);

      // เช็คว่ามีการเลือกไฟล์รูปภาพหรือไม่
      if (avatarFile) {
        dataToSend.append("avatar", avatarFile);
      } else {
        // กรณี API บังคับไฟล์ ถ้าไม่เลือกอาจจะ Error ได้
        // แต่ถ้า API ยอมรับเป็น null หรือไม่ส่ง ก็ไม่ต้องทำอะไรตรงนี้
        // หรือถ้าอยากแจ้งเตือนให้ใส่รูป:
        // setMessage("กรุณาเลือกรูปโปรไฟล์"); setIsLoading(false); return;
      }

      const requestOptions = {
        method: "POST",
        // หมายเหตุ: เมื่อใช้ FormData ไม่ต้องกำหนด Content-Type: application/json
        // Browser จะจัดการตั้งค่า multipart/form-data ให้เองอัตโนมัติ
        body: dataToSend,
        redirect: "follow",
      };

      // 3. ยิง API
      const res = await fetch(
        "http://192.168.1.200/test_drive/project-googledrive/public/api/v1/register",
        requestOptions,
      );

      // เนื่องจากบางที API อาจส่งกลับมาเป็น text หรือ json ให้ลอง handle ดู
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (err) {
        data = { message: textResponse }; // กรณี response ไม่ใช่ JSON
      }

      if (res.ok) {
        setIsSuccess(true);
        setMessage("สมัครสมาชิกสำเร็จ! กำลังพาคุณไปหน้าเข้าสู่ระบบ...");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // แสดง error จาก backend หรือแสดงข้อความ default
        setMessage(data.message || "การลงทะเบียนล้มเหลว กรุณาลองใหม่");
        setIsSuccess(false);
        console.error("Registration Error:", data);
      }
    } catch (err) {
      console.log("error", err);
      setMessage("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans relative overflow-hidden py-10">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-cyan-100 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <div className="relative z-10 w-full max-w-[500px] px-6">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 p-8 md:p-10">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              สร้างบัญชีใหม่
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              คลิกที่รูปด้านบนเพื่ออัปโหลดรูปโปรไฟล์
            </p>

            {/* --- ส่วนแสดงผล Avatar & Upload --- */}
            <div className="relative inline-block group">
              {/* Input File แบบซ่อน */}
              <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Label ครอบรูปภาพเพื่อให้คลิกเปลี่ยนรูปได้ */}
              <label
                htmlFor="avatarUpload"
                className="cursor-pointer relative block group"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 border-4 border-white shadow-lg mb-4 overflow-hidden transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl relative">
                  {/* === มีรูป → แสดง preview === */}
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover animate-in fade-in duration-500"
                    />
                  ) : (
                    /* === ไม่มีรูป → แสดง icon === */
                    <FiUser className="w-10 h-10 text-gray-400" />
                  )}

                  {/* Overlay กล้อง (hover) */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FiCamera className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Badge + */}
                <div className="absolute bottom-4 right-0 w-8 h-8 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                  <FiPlus className="w-4 h-4 text-white" />
                </div>
              </label>
            </div>
          </div>

          {/* Alert Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm text-center font-medium animate-in fade-in zoom-in duration-300 ${isSuccess ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
            >
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Grid สำหรับ Name และ Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-2 ml-1 uppercase tracking-widest">
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="สมชาย ใจดี"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-2 ml-1 uppercase tracking-widest">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="somchai99"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2 ml-1 uppercase tracking-widest">
                อีเมล
              </label>
              <input
                type="email"
                name="email"
                placeholder="somchai@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2 ml-1 uppercase tracking-widest">
                รหัสผ่าน
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2 ml-1 uppercase tracking-widest">
                ยืนยันรหัสผ่าน
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-2 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>สมัครสมาชิก</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Link back to Login */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              มีบัญชีอยู่แล้วใช่ไหม?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-[11px] font-medium opacity-70">
            © 2026 ADDPAY SERVICE CO., LTD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  );
}
