# ╔══════════════════════════════════════════════════════════════════════╗
# ║  Volkstanz Backend — Payload CMS 3 + Next.js 15                          ║
# ║                                                                        ║
# ║  Payload 3 benötigt Next.js als Host für das Admin-UI und die           ║
# ║  REST/GraphQL-Endpunkte. Volles node_modules im Runtime-Image, weil     ║
# ║  Payloads Migration-Loader @payloadcms/db-postgres etc. dynamisch       ║
# ║  lädt — Standalone-Bundle würde diese Packages wegoptimieren.           ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ── Stage 1: Dependencies ───────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# NODE_ENV ungesetzt lassen → devDependencies werden installiert
# (typescript etc. werden für next build gebraucht)
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
# --legacy-peer-deps weil @payloadcms/next sehr enge Peer-Dep-Ranges hat
# (spezifische Next.js-Patch-Versionen). In der Praxis funktioniert Next 15.x
# mit Payload 3.x problemlos über mehrere Patch-Versionen hinweg.
RUN npm install --no-audit --no-fund --legacy-peer-deps

# ── Stage 2: Build ──────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# ADMIN_PATH als Build-Arg — Next.js bäckt den basePath in den Build ein,
# weil absolute Asset-URLs sonst das Prefix verlieren. Ändert sich ADMIN_PATH,
# muss neu gebaut werden (seltene Operation).
ARG NEXT_BASE_PATH=
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH

COPY --from=deps /app/node_modules     ./node_modules
COPY --from=deps /app/package.json     ./package.json
COPY . .

# Next.js baut das Admin-UI + Route-Handler.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production-Runtime ─────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
# basePath muss auch zur Runtime gesetzt sein, sonst generiert Next.js
# nach dem Boot noch URLs ohne Prefix.
ARG NEXT_BASE_PATH=
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH

# sharp (Bild-Verarbeitung) braucht native Libs auf Alpine
RUN apk add --no-cache vips

# Volles node_modules + gebautes .next/ + Source (für Migration-Loader)
# src/app/ wird zur Laufzeit gebraucht, weil Payload importMap.js dynamisch
# aus dem Source-Tree lädt (generiert via `payload generate:importmap`).
COPY --from=builder /app/node_modules     ./node_modules
COPY --from=builder /app/.next            ./.next
COPY --from=builder /app/public           ./public
COPY --from=builder /app/src/app          ./src/app
COPY --from=builder /app/src/migrations   ./src/migrations
COPY --from=builder /app/next.config.mjs  ./next.config.mjs
COPY --from=builder /app/package.json     ./package.json

# Persistente Medien-Uploads
RUN mkdir -p /app/storage
VOLUME /app/storage

EXPOSE 3000

# next start lädt .next/ + führt instrumentation.ts aus (Migrationen).
CMD ["npm", "run", "start"]
