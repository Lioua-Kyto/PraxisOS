import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/main/index.ts"),
        // Force CJS + .js regardless of the root package.json's "type":
        // "module" (needed for the plain-ESM *.config.js files) — Electron's
        // main/preload entry points are loaded via require(), and a stray
        // .mjs/.cjs extension here would silently break the fixed paths
        // main/index.ts uses to locate the preload script.
        output: { format: "cjs", entryFileNames: "[name].js" }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/preload/index.ts"),
        output: { format: "cjs", entryFileNames: "[name].js" }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, "src/renderer"),
    resolve: {
      alias: {
        "@": resolve(__dirname, "src/renderer/src"),
        "@shared": resolve(__dirname, "src/shared")
      }
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/renderer/index.html")
      }
    },
    plugins: [react()]
  }
});
