// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  server: { startupTimeout: 180000 },
  adapter: netlify(),
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
