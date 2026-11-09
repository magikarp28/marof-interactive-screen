import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM);

// Live: the site is served from https://marof.omnivor.hr/ and WordPress from /admin.
const DEFAULT_CMS_URL = "https://marof.omnivor.hr/admin";

// https://vite.dev/config/
export default defineConfig(async ({ command, mode }) => {
  // @ts-expect-error process is a nodejs global
  const env = loadEnv(mode, process.cwd(), "");
  const cms = new URL(env.VITE_CMS_URL || DEFAULT_CMS_URL);
  const cmsPath = cms.pathname.replace(/\/$/, "");

  return {
  plugins: [react(), tailwindcss()],

  // Absolute asset paths so deep links like /5 work; Tauri needs relative ones.
  base: isTauri ? "./" : "/",

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // 4. the app calls the relative /admin/wp-json/wp/v2 API; in dev, forward it to
    // the CMS (VITE_CMS_URL) to avoid CORS.
    proxy: {
      "/admin/wp-json": {
        target: cms.origin,
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => cmsPath + path.replace(/^\/admin/, ""),
      },
    },
  },
  };
});
