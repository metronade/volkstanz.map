import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// ──────────────────────────────────────────────────────────────────────
// Astro-Konfiguration für Volkstanz-Map.
//
// Output: 'static'  → Seiten werden vorgeneriert, wo möglich.
// Adapter: node     → für SSR-Endpoints (API, sitemap, robots).
//
// Eine Seite wird *nicht* prerendered, wenn sie `export const prerender = false`
// setzt. Das gilt für /api/*, /robots.txt, /sitemap.xml.
// ──────────────────────────────────────────────────────────────────────

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 8080,
  },

  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    define: {
      'import.meta.env.ADMIN_PATH': JSON.stringify(process.env.ADMIN_PATH || '/verwaltung'),
      'import.meta.env.DIRECTUS_URL': JSON.stringify(process.env.DIRECTUS_URL || 'http://cms:8055'),
      'import.meta.env.PUBLIC_API_BASE': JSON.stringify(process.env.PUBLIC_API_BASE || '/verwaltung'),
    },
  },
});
