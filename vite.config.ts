import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  root: "app",
  server: {
    port: 8080,
    strictPort: true,
    host: true,
    proxy: {
      "/.netlify": "http://localhost:9999/.netlify",
    },
  },
  build: {
    outDir: "../dist",
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "ably-presence-playground": resolve(
          __dirname,
          "ably-presence-playground/index.html"
        ),
      },
    },
  },
  plugins: [react()],
});
