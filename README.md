# Volkstanz·Map

> Interaktive Plattform für Volkstanzgruppen — DACH-Fokus, global skalierend.
> Heritage-/Manufaktur-Look, DSGVO-konform, vollständig über `docker-compose`.

## Tech-Stack

| Schicht | Wahl | Warum |
|---|---|---|
| Backend / Admin-UI / API | **Directus 11** | Headless CMS, liefert TOTP-2FA, RBAC, Audit-Log, File-Library, i18n-Translation-Fields out-of-the-box |
| Frontend | **Astro 5** + Node-Adapter | SSR für SEO + 0 KB JS by default, Leaflet als Insel |
| Datenbank | **PostgreSQL 16 + PostGIS 3.4** | First-class Geo-Unterstützung, GIST-Index, `ST_SnapToGrid` für Privacy-Rundung |
| Cache / Rate-Limiter | **Redis 7** | Sessions, Cache, Brute-Force-Schutz |
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
│   ├── ${ADMIN_PATH}/*  → cms:8055 (Directus, gleicher Pfad) │
│   └── /                → web:8095 (Astro SSR)               │
└──────┬─────────────────────────────────────────┬────────────┘
       │                                         │
       ▼                                         ▼
┌──────────────┐                          ┌──────────────────┐
│ cms (Directus│  ← /directus/uploads     │ web (Astro Node) │
│     :8055)   │  ← schema (Reflection)   │   :8095          │
└──────┬───────┘                          └────────┬─────────┘
       │                                           │
       ▼                                           ▼
┌────────────────────────────┐            ┌──────────────────┐
│ db (Postgres+PostGIS)      │            │ redis            │
│   :5432                    │            │   :6379          │
└────────────────────────────┘            └──────────────────┘
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
# Beispiel für starke Secrets
openssl rand -hex 24   # → POSTGRES_PASSWORD
openssl rand -hex 24   # → DIRECTUS_SECRET, DIRECTUS_KEY
```

Mindestens erforderlich:
- `POSTGRES_PASSWORD`, `REDIS_PASSWORD`
- `DIRECTUS_SECRET`, `DIRECTUS_KEY`
- `DIRECTUS_ADMIN_EMAIL`, `DIRECTUS_ADMIN_PASSWORD`
- `ADMIN_PATH` (z. B. `/verwaltung`)

**Lokaler Test:** `PUBLIC_URL_BASE` darf leer bleiben oder auf `http://localhost`
gesetzt werden. Sitemap & Co. greifen dann auf den Host-Header des Requests
zurück. Erst für den produktiven Betrieb (mit echter Domain + HTTPS) ist
`PUBLIC_URL_BASE=https://volkstanz.example.org` Pflicht — sonst generiert die
Sitemap relative URLs, die Google abweist.

### 3. Stack starten

```bash
docker compose up -d
docker compose logs -f --tail=50
```

Beim ersten Start initialisiert Directus die Schema-Migration (kann 1–2 Min dauern).

### 4. Directus-Bootstrap

Nach dem ersten Start:

1. Admin-UI unter `${PUBLIC_URL_BASE}${ADMIN_PATH}/` aufrufen
   (z. B. `https://volkstanz.example.org/verwaltung/`)
2. Mit `DIRECTUS_ADMIN_EMAIL` / `DIRECTUS_ADMIN_PASSWORD` einloggen
3. **Sofort Passwort ändern**
4. **TOTP-2FA aktivieren** (Profile → Security → TOTP → QR-Code scannen)
5. Im Schema-Reiter sollten automatisch alle Tabellen als Collections erscheinen

### 5. Directus-Policy für Public-Submissions

Direkt nach dem Setup eine Sache einstellen, damit `/api/submit` funktioniert:

- **Settings → Roles & Permissions → Public**
- **Collection `groups`**: Create = ✓
- **Field Permissions für Create**: nur `status = 'pending'` zulassen
  (Field-Validation: `{ "status": { "_eq": "pending" } }`)
- Alle anderen Felder freigeben (außer `moderated_by`, `moderated_at`)
- **Create-Preset**: `status = pending` erzwingen

Das verhindert, dass öffentliche Submissions sofort als `published` landen.

## Verzeichnisstruktur

```
volkstanz.map/
├── docker-compose.yml           # 5 Services: db, redis, cms, web, router
├── .env.example                 # Template für Secrets
├── .gitignore
│
├── infra/
│   ├── db/init/                 # Postgres-Bootstrap
│   │   ├── 00-extensions.sql    # postgis, pgcrypto, pg_trgm
│   │   ├── 10-core-tables.sql   # groups, audit_logs, cms_content, seo_settings …
│   │   └── 20-seed.sql          # Rollen, Consent v1, SEO-Singleton
│   ├── cms/extensions/          # Directus-Extensions (Hooks, Endpoints)
│   └── router/
│       └── default.conf.template # Nginx-Config mit envsubst für ADMIN_PATH
│
└── web/                         # Astro-Frontend
    ├── Dockerfile               # Multi-Stage: build → node-runtime
    ├── astro.config.mjs
    ├── package.json
    └── src/
        ├── components/          # Header, Footer, Map, SearchBar, CompassRose
        ├── layouts/Base.astro
        ├── lib/
        │   ├── directus.ts      # API-Wrapper + IP-Hashing
        │   ├── markdown.ts      # Subset-Renderer für CMS-Texte
        │   └── types.ts
        ├── i18n/                # de.json, en.json, Helper
        ├── pages/
        │   ├── index.astro      # Home mit Karte
        │   ├── was-ist.astro    # Erklärseite
        │   ├── gruppe-eintragen.astro  # Selbst-Registrierung
        │   ├── impressum.astro
        │   ├── datenschutz.astro
        │   ├── danke.ts         # Submit-Bestätigung
        │   ├── 404.astro
        │   ├── gruppen/[slug].astro  # Gruppenprofil (SSG)
        │   └── api/
        │       ├── groups.geojson.ts
        │       └── submit.ts
        │   robots.txt.ts
        │   sitemap.xml.ts
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

- **IP-Hashing**: SHA-256 mit täglich wechselndem Salt, kein Klartext-IP in DB
- **Geometrie-Rundung**: `geom_public` als Generated Column aus `privacy_level`
- **Consent-Versionierung**: jede Änderung der AGB/DSGVO/KUG wird als neue
  Version gespeichert; Audit-Log referenziert die jeweils geltende Version
- **Karte zeigt nur `geom_public`**, nie die Original-Adresse
- **Kein externes Analytics** (optional: Matomo self-hosted ergänzbar)
- **Cookie-loses Tracking** — einzige Cookies sind `vt_session`, `vt_locale`,
  `vt_consent_v` (alle technisch notwendig)

## Admin-Ablauf

1. **Submission** kommt via `/api/submit` → `groups.status = 'pending'`
2. Moderator sieht sie in der View `v_submissions_queue`
3. Editor → Änderung auf `status = 'published'` setzt automatisch `published_at`
4. Jede Aktion wird in `audit_logs` mit `actor_id`, `ip_hash`, `diff` protokolliert
5. Ablehnung erfordert `rejection_reason` (Pflichtfeld in Directus)

## Erweiterungs-Punkte

- **Custom Directus Endpoints** in `infra/cms/extensions/endpoints/`:
  - `coords/public.ts` — liefert `{id, lng, lat}` für `geom_public` (noch zu implementieren)
  - `stats/summary.ts` — Statistik für Homepage-Hero
- **Custom Hooks** in `infra/cms/extensions/hooks/`:
  - `audit-on-group-change.ts` — automatische Audit-Log-Einträge
- **Multi-Tile-Quellen**: MapTiler / Stadia Maps / eigener Tile-Server in
  `web/src/components/Map.astro` austauschbar

## Backup

```bash
# Postgres dump
docker compose exec db pg_dump -U volkstanz volkstanz > backup-$(date +%F).sql

# Directus uploads
docker compose run --rm -v $(pwd)/backup:/backup alpine \
  cp -r /var/lib/docker/volumes/volkstanz_cms_uploads/_data /backup/
```

## Lizenz

Code: AGPL-3.0 (siehe `LICENSE`)
Inhalt: Bei den jeweiligen Gruppen.

## Beitragen

Pull-Requests willkommen. Für größere Änderungen bitte vorher Issue öffnen.
