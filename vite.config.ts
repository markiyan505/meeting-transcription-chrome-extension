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
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "./src/popup/index.html",
        content: "./src/content/content.ts",
        "content.css": "./src/content/content.css",
        background: "./src/background/background.ts",
        floatpanel: "./src/floatpanel/index.html",
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
      "@": path.resolve(__dirname, "src"),
    },
  },
});
