/**
 * Volkstanz-Map · Payload CMS 3 Konfiguration
 *
 * Schema-in-Code (vs. DB-first). Alle Collections, Hooks, Access
 * Control und Endpoints hier definiert. Änderungen → `payload migrate:create`
 * erzeugt eine neue Migration.
 */
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';

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

  // Sharp-Instanz explizit übergeben — Payload 3.x erkennt sie sonst nicht
  // automatisch (besonders unter Alpine). Behebt die "sharp not installed"-Warnung.
  sharp,

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

  // File-Storage ist auf Collection-Ebene konfiguriert (siehe Media.ts).

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ??
        `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST || 'db'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB}`,
    },
    // Schema-Sync-Modus (Production):
    //   push: false → KEIN drizzle-kit push (würde in nicht-interaktiver
    //                 Umgebung an Konfirmations-Prompts hängen; zudem ist
    //                 Push für Dev-Zwecke gedacht, nicht für Prod)
    //   prod: true  → Payload wendet committete Migrationen in src/migrations/
    //                 automatisch beim Startup an (via `payload migrate`,
    //                 das Next.js-Payload-Plugin triggert)
    //
    // tablesFilter schließt Tabellen aus, die nicht von Payload verwaltet
    // werden, aber im selben Schema liegen (PostGIS-Systemtabellen, eigene
    // Hilfstabellen). Wichtig sowohl für migrate:create (Schema-Diff) als
    // auch für eventuelle Dev-Push-Versuche.
    tablesFilter: [
      '!spatial_ref_sys',       // PostGIS-Systemtabelle (SRIDs)
      '!groups_geom_public',    // eigene Hilfstabelle (snap-geo Hook)
      '!geography_columns',     // PostGIS-View
      '!geometry_columns',      // PostGIS-View
      '!raster_columns',        // PostGIS-View (falls raster ext aktiv)
      '!raster_overviews',      // PostGIS-View
    ],
    push: false,
    prod: true,
  }),

  secret: process.env.PAYLOAD_SECRET || 'change-me-in-production-32-chars-min',

  cors: [],
  csrf: [],
});
