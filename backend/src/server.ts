/**
 * Einstiegspunkt für die Payload-Applikation (Standalone-Server).
 *
 * Payload 3 liefert keinen "Start"-Befehl mehr — wir bauen den
 * Express-Server selbst und mounten Payload's Middleware. Die
 * Admin-UI (unter /admin) und REST-API (unter /api) werden so
 * bereitgestellt.
 *
 * Seed läuft explizit nach getPayload(), weil onInit VOR dem
 * Schema-Push ausgeführt wird (Tabellen existieren dann noch nicht).
 */
import express from 'express';
import sharp from 'sharp';
import { getPayload } from 'payload';
import config from './payload.config';
import { runSeed } from './seed';

const start = async () => {
  const app = express();
  const payload = await getPayload({ config });

  // Schema-Push via drizzle ist jetzt passiert — Seed kann sicher laufen.
  try {
    await runSeed(payload);
  } catch (err) {
    payload.logger.error('[server] Seed failed (non-fatal, continuing):', err);
  }

  // Payload mounten — stellt /admin, /api/* etc. bereit.
  if (typeof (payload as any).express === 'function') {
    (payload as any).express(app);
  } else if (typeof (payload as any).expressMiddleware === 'function') {
    (payload as any).expressMiddleware(app);
  } else {
    payload.logger.error(
      '[server] Payload-Instanz hat keine express/expressMiddleware-Methode.',
    );
    process.exit(1);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    payload.logger.info(`[volkstanz-backend] listening on 0.0.0.0:${port}`);
  });
};

// Sharp geladen explizit — so weiß Payload, dass es verfügbar ist.
void sharp;

start().catch((err) => {
  console.error('[volkstanz-backend] Fatal startup error:', err);
  process.exit(1);
});
