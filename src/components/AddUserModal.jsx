import { useState } from "react";
import { FiX } from "react-icons/fi";
import { API_BASE } from "../api/api.js";

const API_USERS = `${API_BASE}/users`;

const AddUserModal = ({ onClose, onToast }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    status: "user",
  });

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("api_token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      onToast?.({
        type: "error",
        message: "Session หมดอายุ กรุณา Login ใหม่",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("username", form.username);
      formData.append("password", form.password);
      formData.append("status", form.status);

      // ✅ ส่ง avatar แค่ไฟล์เดียว
      if (avatar && avatar instanceof File) {
        formData.append("avatar", avatar);
      }

      const res = await fetch(API_USERS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ ห้ามใส่ Content-Type เอง
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Create failed");
      }

      onToast?.({
        type: "success",
        message: "เพิ่มผู้ใช้เรียบร้อยแล้ว",
      });

      onClose();

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      onToast?.({
        type: "error",
        message: err.message || "เพิ่มผู้ใช้ไม่สำเร็จ",
      });
    } finally {
      setLoading(false);
    }
  };

  const avatarPreview = avatar ? URL.createObjectURL(avatar) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl w-full max-w-md p-8 shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
        >
          <FiX size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          เพิ่มผู้ใช้
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* กัน Chrome autofill */}
          <input type="text" style={{ display: "none" }} />
          <input type="password" style={{ display: "none" }} />

          {/* Avatar */}
          <div>
            <label className="text-sm text-gray-500">รูปโปรไฟล์ ไม่เกิน 2 mb</label>
            <div className="flex items-center gap-4 mt-2">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-14 h-14 rounded-full object-cover border bg-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 border flex items-center justify-center text-xs text-gray-400">
                  No Image
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files[0])}
                className="text-sm"
              />
            </div>
          </div>

          <input
            name="name"
            placeholder="ชื่อ"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-xl border px-4 py-2"
            required
            autoComplete="new-password"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-xl border px-4 py-2 bg-white"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white disabled:opacity-60"
            >
              {loading ? "กำลังบันทึก..." : "เพิ่มผู้ใช้"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
