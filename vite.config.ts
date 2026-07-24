/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Relative base so one build works both at the domain root (local preview) and under a
  // project subpath (GitHub Pages serves this at /hearth/). The app has no client-side
  // router, so relative asset paths are safe.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
    // Only run the curated suite under tests/ and colocated src tests -- never sweep
    // stray *.test.* elsewhere (the deleted .agents/ fossil used to leak into runs).
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
  },
});
