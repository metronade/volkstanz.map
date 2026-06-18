# ╔══════════════════════════════════════════════════════════════════════╗
# ║  Volkstanz Backend — Payload CMS 3                                      ║
# ║                                                                        ║
# ║  Payload 3 hat keinen `payload build` mehr. TypeScript wird via         ║
# ║  tsx zur Laufzeit interpretiert. Das hält das Setup schmal und         ║
# ║  vermeidet eigene Bundler-Konfiguration.                               ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ── Stage 1: Dependencies ───────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# NODE_ENV ungesetzt lassen → devDependencies werden installiert
# (typescript etc. werden für tsx's Type-Check + Sourcemaps gebraucht)
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# ── Stage 2: Production-Runtime ─────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# sharp (Bild-Verarbeitung) braucht native Libs auf Alpine
RUN apk add --no-cache vips-dev

COPY --from=deps /app/node_modules     ./node_modules
COPY --from=deps /app/package.json     ./package.json
COPY . .

# Persistente Medien-Uploads
RUN mkdir -p /app/storage
VOLUME /app/storage

EXPOSE 3000

# tsx führt src/server.ts direkt aus (Payload 3 hat keinen build-Schritt)
CMD ["npm", "run", "start"]
