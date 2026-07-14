import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';

// @astrojs/node forces its production image endpoint (astro/assets/endpoint/node)
// even during `astro dev`, where its resolveOutDir() loops forever and freezes the
// whole dev server on the first /_image request. Pinning the dev endpoint here only
// affects `astro dev`; builds keep the adapter's default.
const isDev = process.argv.includes('dev');

export default defineConfig({
  site: 'https://becode.com.ar',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  ...(isDev && {
    image: { endpoint: { entrypoint: 'astro/assets/endpoint/dev' } },
  }),
  integrations: [react(), sitemap()],
  security: {
    // Sin esta lista, Astro descarta el header Host y arma las URLs del
    // request como http://localhost (sin puerto), lo que rompe el chequeo
    // CSRF de formularios (uploads) y cualquier URL absoluta generada.
    allowedDomains: [
      { hostname: 'becode.com.ar', protocol: 'https' },
      { hostname: 'www.becode.com.ar', protocol: 'https' },
      { hostname: 'localhost', protocol: 'http' },
      { hostname: '127.0.0.1', protocol: 'http' },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.astro/**',
          '**/dist/**',
          '**/*.log',
        ],
      },
    },
  },
  env: {
    schema: {
      OPENAI_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      OPENAI_MODEL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: 'gpt-4o-mini',
      }),
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      UPLOADS_DIR: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: './uploads',
      }),
    },
  },
});
