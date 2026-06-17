# ╔══════════════════════════════════════════════════════════════════════╗
# ║  Volkstanz Backend — Payload CMS 3                                      ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ── Stage 1: Build ──────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ── Stage 2: Production-Runtime ─────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# sharp (Bild-Verarbeitung) braucht native Libs auf Alpine
RUN apk add --no-cache vips-dev

COPY --from=build /app/dist             ./dist
COPY --from=build /app/node_modules     ./node_modules
COPY --from=build /app/package.json     ./package.json

# Persistente Medien-Uploads
RUN mkdir -p /app/storage
VOLUME /app/storage

EXPOSE 3000

CMD ["node", "dist/server.js"]
