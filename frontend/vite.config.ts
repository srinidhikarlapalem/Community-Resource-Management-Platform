import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Community-Resource-Management-Platform/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://backend:8000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
