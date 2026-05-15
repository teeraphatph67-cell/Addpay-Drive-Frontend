import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import MyDrive from "./pages/MyDrive";
import Trash from "./pages/Trash";
import Starred from "./pages/Starred";
import Recent from "./pages/Recent";
import ShareViewer from "./pages/ShareViewer";
import HomeShared from "./pages/SharedWithMe";
import ShareWithMeV2 from "./pages/ShareWithMeV2";
import SessionWatcher from "./components/SessionWatcher";
import AdminDriveUsers from "./pages/AdminDriveUsers";
import ProtectedRoute from "./components/ProtectedRoute";
import SelectionProvider from "./components/SelectionShareViewr/SelectionProvider";
import ListUser from "./pages/ListUser";
import "./index.css";

function App() {
  return (
    <>
      <SessionWatcher />

      <Routes>
        {/* ===== Public ===== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/share/:shareToken/:folderId?"
          element={
            <SelectionProvider>
              <ShareViewer />
            </SelectionProvider>
          }
        />

        {/* ===== Protected ===== */}
        <Route path="/mydrive" element={<ProtectedRoute><MyDrive /></ProtectedRoute>} />
        <Route path="/mydrive/folder/:id" element={<ProtectedRoute><MyDrive /></ProtectedRoute>} />
        <Route path="/trash" element={<ProtectedRoute><Trash /></ProtectedRoute>} />
        <Route path="/trash/folder/:id" element={<ProtectedRoute><Trash /></ProtectedRoute>} />
        <Route path="/starred" element={<ProtectedRoute><Starred /></ProtectedRoute>} />
        <Route path="/recent" element={<ProtectedRoute><Recent /></ProtectedRoute>} />
        <Route path="/homeshared" element={<ProtectedRoute><HomeShared /></ProtectedRoute>} />
        <Route path="/shared-v2" element={<ProtectedRoute><ShareWithMeV2 /></ProtectedRoute>} />

        {/* ===== Admin Drive Users ===== */}

        {/* หน้า list user drive */}
        <Route
          path="/driveuser"
          element={<ProtectedRoute><AdminDriveUsers /></ProtectedRoute>}
        />

        {/* 👉 เปิด Drive */}
        <Route
          path="/driveuser/:driveId"
          element={<ProtectedRoute><AdminDriveUsers /></ProtectedRoute>}
        />

        {/* 👉 เปิด Folder ใน Drive */}
        <Route
          path="/driveuser/:driveId/folder/:folderId"
          element={<ProtectedRoute><AdminDriveUsers /></ProtectedRoute>}
        />

        <Route path="/listuser" element={<ProtectedRoute><ListUser /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;