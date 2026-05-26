// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   base:"/mydrive/service-ui/mydrive",
//   server: {
   
//     host: '127.0.0.1',
//     port: 5173,
//     proxy: {
//       "/api": {
//         target: "http://127.0.0.1:8000",
//         changeOrigin: true,
//       },
//     },
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,

    allowedHosts: [
      "treasures-pound-juice-patent.trycloudflare.com"
    ],

    proxy: {
      "/api": {
        target: "https://addpay-drive-backend-production.up.railway.app",
        changeOrigin: true,
      },
    },
  },
});