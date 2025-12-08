import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8085,
    open: "/",
    proxy: {
      "/vietqr": {
        target: "https://api.vietqr.io",
        changeOrigin: true,    
        secure: true,         
        rewrite: (path) => path.replace(/^\/vietqr/, ""),
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: ["https://sqm-client.datacenter.tms-s.vn", "https://sqm-client.datacenter.tms-s.vn"]
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));