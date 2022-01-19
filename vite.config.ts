import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 1254
  },
  // build: {
  //   // 打包大小限制20M
  //   chunkSizeWarningLimit: 20000,
  // }
})
