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
        content: "./src/content/content.ts",
        background: "./src/background/background.ts",
        floatpanel: "./src/entries/floatpanel/index.html",
        "subtitles-panel": "./src/entries/subtitles-panel/index.html",
        dev: "./src/entries/dev/index.html",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: (chunkInfo) => {
          // Replace underscores with hyphens to avoid Chrome extension issues
          return `chunk-${chunkInfo.name.replace(/_/g, "-")}.js`;
        },
        assetFileNames: "[name].[ext]",
        manualChunks: undefined, // Disable automatic chunking
        format: "es", // Use ES modules format for other scripts
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
