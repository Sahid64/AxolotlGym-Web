import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      // React y el router cambian poco: en su propio archivo el navegador los conserva en caché entre despliegues
      output: { manualChunks: { react: ["react", "react-dom", "react-router-dom"] } },
    },
  },
});
