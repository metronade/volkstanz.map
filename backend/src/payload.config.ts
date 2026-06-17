/**
 * Volkstanz-Map · Payload CMS 3 Konfiguration
 *
 * Schema-in-Code (vs. DB-first). Alle Collections, Hooks, Access
 * Control und Endpoints hier definiert. Änderungen → `payload migrate:create`
 * erzeugt eine neue Migration.
 */
import { buildConfig } from 'payload/config';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Users } from './collections/Users';
import { Groups } from './collections/Groups';
import { Content } from './collections/Content';
import { AuditLogs } from './collections/AuditLogs';
import { ConsentVersions } from './collections/ConsentVersions';
import { SeoSettings } from './collections/SeoSettings';
import { Media } from './collections/Media';

import { publicCoordsEndpoint } from './endpoints/public-coords';
import { statsSummaryEndpoint } from './endpoints/stats-summary';
import { submitGroupEndpoint } from './endpoints/submit-group';
import { robotsEndpoint } from './endpoints/robots';
import { sitemapEndpoint } from './endpoints/sitemap';
import { totpSetupEndpoint, totpVerifyEndpoint, totpDisableEndpoint } from './endpoints/totp-setup';

import { runSeed } from './seed';

const root = fileURLToPath(new URL('.', import.meta.url));

export default buildConfig({
  admin: {
    user: 'users',
    autoLogin: false,
    // Pfad unter dem das Admin-UI läuft (intern, Nginx reicht das weiter)
    routes: {
      admin: '/admin',
      api: '/api',
    },
  },

  routes: {
    admin: '/admin',
    api: '/api',
  },

  // Rate-Limiting im In-Memory-Store
  rateLimit: {
    max: Number(process.env.RATE_LIMITER_POINTS) || 500,
    duration: Number(process.env.RATE_LIMITER_DURATION) || 60,
    trustProxy: true,
  },

  collections: [
    Users,
    Groups,
    Content,
    ConsentVersions,
    AuditLogs,
    SeoSettings,
    Media,
  ],

  endpoints: [
    publicCoordsEndpoint,
    statsSummaryEndpoint,
    submitGroupEndpoint,
    robotsEndpoint,
    sitemapEndpoint,
    totpSetupEndpoint,
    totpVerifyEndpoint,
    totpDisableEndpoint,
  ],

  // Lokale File-Storage für Medien-Uploads
  upload: {
    useLocalStorage: true,
    staticURL: '/storage',
    staticDir: path.resolve(root, '../storage'),
  },

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ??
        `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST || 'db'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB}`,
    },
    // Push-Mode: Schema wird automatisch gehalten (ohne explizite Migration).
    // Für Produktion auf 'migrate' umstellen.
    push: false,
    prod: true,
  }),

  secret: process.env.PAYLOAD_SECRET || 'change-me-in-production-32-chars-min',

  cors: [],
  csrf: [],

  // Beim ersten Start: Consent v1, SEO-Singleton, initialer Admin.
  // Idempotent — alle Seeds prüfen vorher, ob schon vorhanden.
  onInit: runSeed,
});
