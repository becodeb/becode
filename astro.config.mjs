import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  site: 'https://becode.com.ar',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
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
    },
  },
});
