import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    target: 'node20',
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: {
        'main/main': path.resolve(__dirname, 'src/main/main.ts'),
        'preload/index': path.resolve(__dirname, 'src/preload/index.ts'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'fs',
        'path',
        'os',
        'events',
        'child_process',
        'crypto',
        'http',
        'https',
        'url',
        'util',
      ],
      output: {
        entryFileNames: '[name].js',
      },
    },
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@preload': path.resolve(__dirname, 'src/preload'),
    },
  },
});
