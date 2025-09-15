import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

// TypeScript declaration for __dirname in ES modules
declare const __dirname: string;

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "manifest.json",
          dest: ".",
        },
        {
          src: "icons",
          dest: ".",
        },
        {
          src: "src/content/panels/panel.css",
          dest: ".",
        },
        {
          src: "src/content/notifications/notification.css",
          dest: ".",
        },
      ],
    }),
  ],
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "./src/entries/popup/index.html",
        "content.css": "./src/content/content.css",
        "panel.css": "./src/content/panels/panel.css",
        "notification.css": "./src/content/notifications/notification.css",
        background: "./src/background/background.ts",
        "auth-bridge": "./src/content/auth-bridge.ts",
        floatpanel: "./src/entries/floatpanel/index.html",
        "subtitles-panel": "./src/entries/subtitles-panel/index.html",
        dev: "./src/entries/dev/index.html",
        manifest: "./manifest.json",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: (chunkInfo) => {
          // Replace underscores with hyphens to avoid Chrome extension issues
          return `chunk-${chunkInfo.name.replace(/_/g, "-")}.js`;
        },
        assetFileNames: "[name].[ext]",
        manualChunks: undefined, // Disable automatic chunking
        format: "es", // Use ES modules format
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
