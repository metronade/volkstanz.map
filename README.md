# Volkstanz·Map

> Interaktive Plattform für Volkstanzgruppen — DACH-Fokus, global skalierend.
> Heritage-/Manufaktur-Look, DSGVO-konform, vollständig über `docker-compose`.

## Tech-Stack

| Schicht | Wahl | Warum |
|---|---|---|
| Backend / Admin-UI / API | **Payload CMS 3** (Node.js, TypeScript) | Schema-in-Code, REST + Local-API, RBAC, Lexical-Rich-Text, eigene Hooks/Endpoints |
| Frontend | **Astro 5** + Node-Adapter | SSR für SEO + 0 KB JS by default, Leaflet als Insel |
| Datenbank | **PostgreSQL 16 + PostGIS 3.4** | First-class Geo-Unterstützung, GIST-Index, `MakePoint`-Generated-Column für Privacy-Rundung |
| Router | **Nginx 1.27** | Dynamischer Admin-Pfad, Path-Routing zwischen CMS & Web |

## Architektur-Überblick

```
┌─────────────────────────────────────────────────────────────┐
│  Externer Nginx Proxy Manager (NPM, Port 80/443)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  router (nginx) — hört auf :80                               │
│   ├── ${ADMIN_PATH}/*  → cms:3000 (Payload Admin + API)     │
│   └── /                → web:8095 (Astro SSR)               │
└──────┬─────────────────────────────────────────┬────────────┘
       │                                         │
       ▼                                         ▼
┌──────────────┐                          ┌──────────────────┐
│ cms (Payload │  ← /storage (Media)      │ web (Astro Node) │
│     :3000)   │  ← /api/* (REST)         │   :8095          │
└──────┬───────┘                          └────────┬─────────┘
       │                                           │
       └──────────────┬────────────────────────────┘
                      ▼
              ┌────────────────────┐
              │ db (Postgres+PostGIS) │
              │   :5432              │
              └────────────────────┘
```

## Schnellstart

### 1. Repository + Environment

```bash
git clone <repo> volkstanz.map
cd volkstanz.map
cp .env.example .env
```

### 2. Secrets setzen

In `.env` mindestens diese Werte setzen (mit echten Zufallsstrings):

```bash
openssl rand -hex 24   # → POSTGRES_PASSWORD
openssl rand -hex 24   # → PAYLOAD_SECRET
```

Mindestens erforderlich:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `PAYLOAD_SECRET`
- `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`
- `ADMIN_PATH` (z. B. `/verwaltung` oder ein zufälliger Token-Pfad)

**Lokaler Test:** `PUBLIC_URL_BASE` darf leer bleiben oder auf `http://localhost`
gesetzt werden. Sitemap & Co. greifen dann auf den Host-Header des Requests
zurück. Erst für den produktiven Betrieb (mit echter Domain + HTTPS) ist
`PUBLIC_URL_BASE=https://volkstanz.example.org` Pflicht — sonst generiert die
Sitemap relative URLs, die Google abweist.

### 3. Stack starten

```bash
docker compose up -d --build
docker compose logs -f --tail=50
```

Beim ersten Start:
1. Postgres legt die Hilfs-Tabelle `groups_geom_public` (PostGIS) an.
2. Payload migriert das Schema automatisch (`prod: true`, `push: false`).
3. Der Seed legt initialen Admin + Consent v1 + SEO-Singleton an, falls leer.

Das dauert typischerweise 30–60 Sekunden.

### 4. Admin-Login

1. Admin-UI unter `${PUBLIC_URL_BASE}${ADMIN_PATH}/admin` aufrufen
   (z. B. `https://volkstanz.example.org/verwaltung/admin`)
2. Mit `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` einloggen
3. **Sofort Passwort ändern**
4. **TOTP-2FA aktivieren** via `POST ${ADMIN_PATH}/api/users/me/totp/setup`
   (ggf. über ein kurzes Admin-UI-Plugin; siehe `backend/src/endpoints/totp-setup.ts`)

Public-Submissions landen automatisch als `status = 'pending'` — der Server
erzwingt diesen Status unabhängig vom Client (`backend/src/endpoints/submit-group.ts`).

## Verzeichnisstruktur

```
volkstanz.map/
├── docker-compose.yml           # 4 Services: db, cms, web, router
├── .env.example                 # Template für Secrets
├── .gitignore
│
├── infra/
│   ├── db/init/                 # Postgres-Bootstrap
│   │   ├── 00-extensions.sql    # postgis, pgcrypto, pg_trgm, btree_gist
│   │   └── 05-payload-helpers.sql # groups_geom_public (GIST-indexed)
│   └── router/
│       └── default.conf.template # Nginx-Config mit envsubst für ADMIN_PATH
│
├── backend/                     # Payload CMS 3
│   ├── Dockerfile               # Multi-Stage node:22-alpine + vips
│   ├── package.json             # Payload 3, postgres-adapter, lexical, otplib
│   ├── tsconfig.json
│   └── src/
│       ├── payload.config.ts    # Schema-in-Code: alle Collections + Endpoints
│       ├── server.ts            # Standalone-Server-Entry
│       ├── seed.ts              # Bootstrap: Admin + Consent v1 + SEO-Singleton
│       ├── access/              # Access-Control (isPublicRead, isAdminOrModerator)
│       ├── collections/         # Users, Groups, Content, ConsentVersions,
│       │                        # AuditLogs, SeoSettings, Media
│       ├── endpoints/           # /submit-group, /public-coords, /stats-summary,
│       │                        # /robots, /sitemap, /totp-setup|verify|disable
│       └── hooks/               # snap-geo, audit-change, anonymize-ip
│
└── web/                         # Astro-Frontend
    ├── Dockerfile               # Multi-Stage: build → node-runtime
    ├── astro.config.mjs         # vite.resolve.alias für @components, @lib, …
    ├── package.json
    └── src/
        ├── components/          # Header, Footer, Map, SearchBar, CompassRose
        ├── layouts/Base.astro
        ├── lib/
        │   ├── payload.ts       # API-Wrapper (payloadGet, assetUrl) + Types
        │   └── markdown.ts      # Subset-Renderer + Lexical→Markdown
        ├── i18n/                # de.json, en.json, Helper
        ├── pages/
        │   ├── index.astro      # Home mit Karte
        │   ├── gruppe-eintragen.astro  # Selbst-Registrierung
        │   ├── impressum.astro
        │   ├── datenschutz.astro
        │   ├── danke.ts         # Submit-Bestätigung
        │   ├── 404.astro
        │   ├── gruppen/[slug].astro  # Gruppenprofil (SSG)
        │   ├── robots.txt.ts    # Proxy → Payload /api/robots
        │   ├── sitemap.xml.ts   # Proxy → Payload /api/sitemap
        │   └── api/
        │       ├── groups.geojson.ts  # FeatureCollection aus Payload
        │       └── submit.ts          # Proxy → Payload /api/submit-group
        └── styles/
            ├── tokens.css       # Design-Tokens (Farben, Typo, Spacing)
            └── base.css         # Reset, Elemente, Komponenten
```

## Design-System

Die Farben und die Typografie sind als CSS Custom Properties in
`web/src/styles/tokens.css` definiert. Anpassungen am Heritage-Look zentral dort.

| Token | Wert | Verwendung |
|---|---|---|
| `--paper-base` | `#F5EFE3` | Seiten-Hintergrund |
| `--ink-primary` | `#2B2724` | Haupttext |
| `--accent-forest` | `#3D5641` | Primärbuttons |
| `--accent-wine` | `#7A2E2E` | Hover, Hervorhebungen |
| `--accent-gold` | `#B08A3E` | Haarlinien, Initialen |
| `--font-display` | Cormorant Garamond | Überschriften |
| `--font-body` | Inter | Fließtext, UI |
| `--font-mono` | JetBrains Mono | Koordinaten, Metadaten |

OSM-Kacheln werden via `--map-filter` (Sepia + Hue-Rotate) an den Papier-Look
angepasst — definierbar in `tokens.css`.

## Datenschutz-Features

- **IP-Hashing**: SHA-256 mit täglich wechselndem Salt, kein Klartext-IP in DB.
  Prefix (/24 für IPv4, /48 für IPv6) wird separat gespeichert für Rate-Limiting.
- **Geometrie-Rundung**: `groups_geom_public` als Hilfstabelle mit MakePoint(lng,lat)
  und GIST-Index. Rundungs-Level hängt vom `privacy_level` der Gruppe ab:
  - `exact` (~100 m), `neighborhood` (~500 m), `city` (~2 km), `region` (~10 km)
- **Consent-Versionierung**: jede Änderung der AGB/DSGVO/KUG wird als neue Version
  in `consent_versions` gespeichert (alte bleiben erhalten). Groups referenzieren
  die jeweils geltende Version.
- **Karte zeigt nur `groups_geom_public`**, nie die Original-Koordinaten.
- **Kein externes Analytics**, keine Google Fonts.
- **Audit-Log** append-only (`audit_logs`) für jede Mutation an Groups.

## Admin-Ablauf

1. **Submission** kommt via `/api/submit` → Proxy → Payload `/api/submit-group`.
   Ergebnis: `groups.status = 'pending'`, Audit-Log-Eintrag mit `actorType=submitter`.
2. Moderator sieht Pending-Einträge im Payload-Admin-Filter `status = pending`.
3. Editor → Änderung auf `status = 'published'` setzt via Hook automatisch
   `published_at` und schreibt die gerundeten Koordinaten nach `groups_geom_public`.
4. Jede Aktion wird via `audit-change`-Hook mit IP-Hash + Prefix protokolliert.
5. Ablehnung erfordert `rejection_reason` (Pflichtfeld bei `status = rejected`).

## Wichtige Endpoints

**Public:**
- `GET /api/groups?where=…` — Payload-Standard-Query
- `GET /api/public-coords` — gerundete Koordinaten (PostGIS) für Karte
- `GET /api/groups.geojson` (Astro) — FeatureCollection für Leaflet
- `GET /api/stats-summary` — Gruppen-/Länder-Statistik für Hero
- `POST /api/submit-group` — Public-Submission (erzwingt `status=pending`)
- `GET /api/robots` / `/api/sitemap` — aus `seo_settings` generiert

**Auth (Admin):**
- `POST /api/users/me/totp/setup` — generiert TOTP-Secret
- `POST /api/users/me/totp/verify` — aktiviert 2FA
- `POST /api/users/me/totp/disable` — deaktiviert 2FA (erfordert Passwort)

## Backup

```bash
# Postgres dump
docker compose exec db pg_dump -U volkstanz volkstanz > backup-$(date +%F).sql

# Payload Media-Storage
docker compose run --rm -v $(pwd)/backup:/backup alpine \
  cp -r /var/lib/docker/volumes/volkstanz_cms_storage/_data /backup/
```

## Lizenz

Code: AGPL-3.0 (siehe `LICENSE`)
Inhalt: Bei den jeweiligen Gruppen.

## Beitragen

Pull-Requests willkommen. Für größere Änderungen bitte vorher Issue öffnen.
