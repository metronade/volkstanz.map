/**
 * Einstiegspunkt für die Payload-Payload-Applikation (Standalone-Server).
 * Lauscht auf 0.0.0.0:3000, Proxy-Header (X-Forwarded-*) werden vertraut.
 */
import express from 'payload';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const start = async () => {
  const root = fileURLToPath(new URL('.', import.meta.url));
  await express.start({
    config: path.resolve(root, './payload.config.ts'),
  });
};

start().catch((err) => {
  console.error('[volkstanz-backend] Fatal startup error:', err);
  process.exit(1);
});
