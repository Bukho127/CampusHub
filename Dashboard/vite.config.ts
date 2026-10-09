import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiUrl = new URL(env.VITE_API_BASE_URL ?? "https://campushub-backend-bukho-20261009.azurewebsites.net/api");
  return {
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiUrl.origin,
        changeOrigin: true,
        cookieDomainRewrite: "",
        rewrite: (path) => apiUrl.pathname.replace(/\/$/, "") + path.slice(4)
      }
    }
  }
  };
});
