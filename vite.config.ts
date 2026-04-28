import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.PUBLIC_BASE_PATH ?? '/studiocity/',
});
