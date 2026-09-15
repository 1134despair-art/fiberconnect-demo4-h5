import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    })
  ],
  root: './src',
  server: {
    host: '127.0.0.1',
    port: 8081,
    strictPort: true,
    open: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
