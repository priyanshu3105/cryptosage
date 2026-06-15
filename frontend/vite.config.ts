import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Read PORT from ../backend/.env so the dev proxy always targets the CryptoSage API (avoids 404s when another app uses 4000). */
function readBackendPort(): number {
  const envPath = path.resolve(__dirname, "../backend/.env");
  try {
    const raw = fs.readFileSync(envPath, "utf8");
    const m = raw.match(/^PORT\s*=\s*(\d+)/m);
    if (m) {
      const p = parseInt(m[1], 10);
      if (p >= 1 && p <= 65535) return p;
    }
  } catch {
    // missing or unreadable .env
  }
  return 4000;
}

const backendPort = readBackendPort();
const backendOrigin = `http://127.0.0.1:${backendPort}`;

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: backendOrigin,
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
