import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: { usePolling: true },
    proxy: { '/api': { target: 'http://api:8000' } }
  }
});
