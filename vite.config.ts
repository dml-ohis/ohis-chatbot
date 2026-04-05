import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Widget library build
  if (mode === 'widget') {
    return {
      plugins: [react(), tailwindcss()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/widget.tsx'),
          name: 'PMChatbotWidget',
          fileName: () => 'pm-chatbot-widget.js',
          formats: ['iife'],
        },
        rollupOptions: {
          // Bundle everything — the widget must be self-contained
          external: [],
        },
        outDir: 'dist-widget',
        cssCodeSplit: false,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    }
  }

  // Default app build
  return {
    plugins: [react(), tailwindcss()],
  }
})
