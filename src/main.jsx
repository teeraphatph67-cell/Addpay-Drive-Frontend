// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.jsx";
// import "./index.css";

// // ⭐ เพิ่มบรรทัดนี้
// import { GoogleOAuthProvider } from "@react-oauth/google";

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <BrowserRouter base="/mydrive/service-ui/mydrive">
//       <GoogleOAuthProvider clientId="26347662510-jupv2fe9flsvd8f3nejaqet8jimtkhi8.apps.googleusercontent.com">
//         <App />
//       </GoogleOAuthProvider>
//     </BrowserRouter>
//   </React.StrictMode>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // 1. ต้อง Import ตัวนี้ด้วย
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 2. เปลี่ยนจาก base เป็น basename */}
    <BrowserRouter>
      <GoogleOAuthProvider clientId="26347662510-jupv2fe9flsvd8f3nejaqet8jimtkhi8.apps.googleusercontent.com">
        

        <App />
      
      </GoogleOAuthProvider>
        </BrowserRouter>

  </React.StrictMode>
);