/**
 * Einstiegspunkt für die Payload-Applikation (Standalone-Server).
 *
 * Payload 3 liefert keinen "Start"-Befehl mehr — wir bauen den
 * Express-Server selbst und mounten Payload's Middleware. Die
 * Admin-UI (unter /admin) und REST-API (unter /api) werden so
 * bereitgestellt.
 */
import express from 'express';
import { getPayload } from 'payload';
import config from './payload.config';

const start = async () => {
  const app = express();
  const payload = await getPayload({ config });

  // Payload mounten — stellt /admin, /api/* etc. bereit.
  // In v3 heißt der Middleware-Export am Payload-Objekt "express".
  if (typeof (payload as any).express === 'function') {
    (payload as any).express(app);
  } else if (typeof (payload as any).expressMiddleware === 'function') {
    (payload as any).expressMiddleware(app);
  } else {
    payload.logger.error(
      '[server] Payload-Instanz hat keine express/expressMiddleware-Methode. ' +
      'Prüfe die Payload-3-Doku für die aktuelle Standalone-Server-API.',
    );
    process.exit(1);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    payload.logger.info(`[volkstanz-backend] listening on 0.0.0.0:${port}`);
  });
};

start().catch((err) => {
  console.error('[volkstanz-backend] Fatal startup error:', err);
  process.exit(1);
});
