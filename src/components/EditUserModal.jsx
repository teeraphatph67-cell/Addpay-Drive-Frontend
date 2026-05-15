import { useState } from "react";
import { FiX } from "react-icons/fi";
import { API_BASE } from "../api/api.js";

const API_USERS = `${API_BASE}/users`;

const EditUserModal = ({ user, onClose, onToast }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    status: user?.status || "user",
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
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("status", form.status);

      if (avatar instanceof File) {
        formData.append("avatar", avatar);
      }

      const res = await fetch(`${API_USERS}/${user.id}`, {
        method: "POST", // backend นี้ใช้ POST แก้ไข
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Update failed");

      // ✅ Toast สำเร็จ
      onToast?.({
        type: "success",
        message: "แก้ไขผู้ใช้เรียบร้อยแล้ว",
      });

      onClose();

      // ✅ รีเฟรชหน้า 1 ครั้ง
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error(err);

      onToast?.({
        type: "error",
        message: "แก้ไขผู้ใช้ไม่สำเร็จ",
      });
    } finally {
      setLoading(false);
    }
  };

  const avatarPreview = avatar
    ? URL.createObjectURL(avatar)
    : user.avatar_url
    ? user.avatar_url.startsWith("http")
      ? user.avatar_url
      : `${API_BASE.replace("/api/v1", "")}/${user.avatar_url}`
    : undefined; // ❌ ไม่ยิง request ถ้าไม่มีรูป

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl w-full max-w-md p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
        >
          <FiX size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          แก้ไขผู้ใช้
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div>
            <label className="text-sm text-gray-500">รูปโปรไฟล์</label>
            <div className="flex items-center gap-4 mt-2">
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  className="w-14 h-14 rounded-full object-cover border bg-gray-100"
                  alt="avatar"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files[0])}
                className="text-sm"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-gray-500">ชื่อ</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border px-4 py-2"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border px-4 py-2"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-gray-500">สถานะ</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border px-4 py-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-gray-600"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
