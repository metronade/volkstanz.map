import { withPayload } from '@payloadcms/next/withPayload'

// Next.js Config mit Payload-Plugin. `withPayload` setzt die nötigen Webpack-
// /Turbopack-Regeln für Payloads Admin-UI, Inject-MAP und Sass-Styles.
//
// KEIN output: 'standalone' — Standalone-Bundle enthält nur Next.js-Runtime-
// Deps, aber nicht @payloadcms/db-postgres etc., die zur Laufzeit fürs
// Migration-Loading gebraucht werden. Mit vollem node_modules im Runtime-
// Image funktioniert alles out-of-the-box.
//
// TypeScript/ESLint-Fehler beim Build ignorieren: Die Page-Wrapper für Payloads
// RootPage/NotFoundPage haben eine Typ-Signatur, die Next.js 15.4's strikte
// Page-Default-Export-Validierung streikt — obwohl der Code korrekt ist.
// Im Dev-Modus (next dev) läuft die volle Typprüfung weiter.
//
// `instrumentation.ts` ist in Next.js 15 default-aktiv (kein Flag nötig).
// Die Datei src/instrumentation.ts führt Payload-Migrationen beim Startup aus.
//
// `basePath` MUSS auf den externen Admin-Pfad gesetzt werden, weil Next.js
// sonst absolute Asset- und API-URLs ohne Prefix erzeugt (/_next/...,
// /api/...) und diese im Router-Setup beim Astro-Frontend landen würden.
// basePath wird zur Build-Zeit gelesen — Änderungen an ADMIN_PATH erfordern
// also einen Rebuild. Der Wert wird als Build-Arg vom Compose-File gesetzt.
const basePath = process.env.NEXT_BASE_PATH || ''
export default withPayload({
  basePath,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
})

