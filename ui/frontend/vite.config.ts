import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  root: "./frontend",
  plugins: [react()],
  // base: "./",
  server: {
    proxy: {
      // Proxy API requests to Express server
      "/api": "http://localhost:3000",
      "/hc": "http://localhost:3000",
    },
  },
  build: {
    outDir: "../dist/frontend/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "./frontend/index.html",
    },
  },
});
