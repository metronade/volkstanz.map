# ╔══════════════════════════════════════════════════════════════════════╗
# ║  Volkstanz-Web — Astro Frontend                                        ║
# ║  Multi-Stage Build: deps → build → runtime                             ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ── Stage 1: Build ──────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies zuerst (besserer Layer-Cache)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Source + Build
COPY . .
RUN npm run build

# ── Stage 2: Production-Runtime ─────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# Nur das nötigste übernehmen
COPY --from=build /app/dist            ./dist
COPY --from=build /app/node_modules    ./node_modules
COPY --from=build /app/package.json    ./package.json

EXPOSE 8080

# Astro Node-Adapter standalone mode
CMD ["node", "./dist/server/entry.mjs"]
