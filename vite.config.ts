import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

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
          src: "src/interact.min.js",
          dest: ".",
          rename: "interact.js",
        },
      ],
    }),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        content: resolve(__dirname, "src/content/content.ts"),
        "content.css": resolve(__dirname, "src/content/content.css"),
        background: resolve(__dirname, "src/background/background.ts"),
        floatpanel: resolve(__dirname, "src/floatpanel/index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: (chunkInfo) => {
          // Replace underscores with hyphens to avoid Chrome extension issues
          return `chunk-${chunkInfo.name.replace(/_/g, "-")}.js`;
        },
        assetFileNames: "[name].[ext]",
        manualChunks: undefined, // Disable automatic chunking
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
