import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/api-proxy': 'http://localhost:8080',
      '/perplexity-proxy': 'http://localhost:8080',
      '/deepseek-proxy': 'http://localhost:8080',
      '/virouter-proxy': 'http://localhost:8080'
    }
  }
});

