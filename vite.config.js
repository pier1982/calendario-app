import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // abilita l'ascolto su tutte le interfacce (0.0.0.0)
    port: 5173,      // (opzionale) fissa la porta
    strictPort: true // fallisce se 5173 è occupata
  },
  build: {
    rollupOptions: {
      output: {
        // Genera nomi di file con hash per evitare problemi di cache
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
