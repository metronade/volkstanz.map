import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { fileURLToPath } from 'node:url';

// ──────────────────────────────────────────────────────────────────────
// Astro-Konfiguration für Volkstanz-Map.
//
// Output: 'static'  → Seiten werden vorgeneriert, wo möglich.
// Adapter: node     → für SSR-Endpoints (API, sitemap, robots).
//
// Eine Seite wird *nicht* prerendered, wenn sie `export const prerender = false`
// setzt. Das gilt für /api/*, /robots.txt, /sitemap.xml.
//
// Path-Aliase (z. B. @components, @styles) müssen Vite-seitig bekannt sein –
// tsconfig.json reicht nur für TypeScript-Typauflösung, nicht für den Build.
// ──────────────────────────────────────────────────────────────────────

const root = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 8095,
  },

  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    resolve: {
      alias: {
        '@components': `${root}src/components`,
        '@layouts':    `${root}src/layouts`,
        '@styles':     `${root}src/styles`,
        '@lib':        `${root}src/lib`,
        '@i18n':       `${root}src/i18n`,
      },
    },
    define: {
      'import.meta.env.ADMIN_PATH': JSON.stringify(process.env.ADMIN_PATH || '/verwaltung'),
      'import.meta.env.PAYLOAD_URL': JSON.stringify(process.env.PAYLOAD_URL || 'http://cms:3000'),
      'import.meta.env.PUBLIC_API_BASE': JSON.stringify(process.env.PUBLIC_API_BASE || '/verwaltung'),
    },
  },
});
