import { useEffect, useState } from "react";
import DriveLayout from "../components/DriveLayout";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import EditUserModal from "../components/EditUserModal";
import AddUserModal from "../components/AddUserModal";
import Toast from "../components/Toast";
import SearchFilter from "../components/SearchFilter.jsx";
import { API_BASE, BASE_URL } from "../api/api.js";

const API_USERS = `${API_BASE}/users`;

/* ================= Avatar ================= */
const Avatar = ({ user }) => {
  if (user.avatar_url) {
    const src = user.avatar_url.startsWith("http")
      ? user.avatar_url
      : `${BASE_URL}${user.avatar_url}`;

    return (
      <img
        src={src}
        alt={user.name}
        className="w-9 h-9 rounded-full object-cover bg-gray-100"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center text-sm font-semibold">
      {user.name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
};

/* ================= Page ================= */
const ListUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState(null);

  /* ===== Search ===== */
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) => {
    if (!search) return true;

    const keyword = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword) ||
      u.username?.toLowerCase().includes(keyword)
    );
  });

  const token = localStorage.getItem("api_token");

  /* ================= Load users ================= */
  useEffect(() => {
    fetch(API_USERS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status) {
          setUsers(res.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  /* ================= Delete ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันลบผู้ใช้นี้?")) return;

    try {
      const res = await fetch(`${API_USERS}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setToast({ type: "success", message: "ลบผู้ใช้สำเร็จ" });
      } else {
        setToast({ type: "error", message: "ลบผู้ใช้ไม่สำเร็จ" });
      }
    } catch {
      setToast({ type: "error", message: "เกิดข้อผิดพลาด" });
    }
  };

  const renderStatus = (status) =>
    status === "admin" ? (
      <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
        Admin
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
        User
      </span>
    );

  return (
    <DriveLayout>
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent">
        ไดรฟ์ของผู้ใช้ทั้งหมด
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        รายชื่อผู้ใช้ทั้งหมด ดูและจัดการผู้ใช้ทั้งหมดในระบบ
      </p>

      {/* Search */}
      <SearchFilter search={search} setSearch={setSearch} />

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl px-8 py-7 shadow-xl text-center">
            <div className="relative mx-auto mb-5 w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="font-semibold text-sm">กำลังโหลดข้อมูล</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-semibold">
            รายชื่อผู้ใช้ทั้งหมด
          </h2>

          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          >
            <FiPlus />
            เพิ่มผู้ใช้
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4 text-left">ผู้ใช้</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="hidden lg:table-cell px-6 py-4">
                    Username
                  </th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-gray-400"
                    >
                      ไม่พบข้อมูลผู้ใช้
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="lg:hidden text-xs text-gray-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {user.email}
                      </td>

                      <td className="hidden lg:table-cell px-6 py-4">
                        {user.username}
                      </td>

                      <td className="px-6 py-4">
                        {renderStatus(user.status)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onToast={setToast}
          onSuccess={(res) => {
            if (res.id) {
              setUsers((prev) =>
                prev.map((u) => (u.id === res.id ? res : u))
              );
            }
          }}
        />
      )}

      {addOpen && (
        <AddUserModal
          onClose={() => setAddOpen(false)}
          onToast={setToast}
          onSuccess={(res) => {
            if (res.user) {
              setUsers((prev) => [res.user, ...prev]);
            }
          }}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </DriveLayout>
  );
};

export default ListUser;
