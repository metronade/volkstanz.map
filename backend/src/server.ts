/**
 * Einstiegspunkt für die Payload-Applikation (Standalone-Server).
 *
 * In Payload 3 starten wir den HTTP-Server via payload.createHTTPServer().
 * Der Seed läuft explizit nach getPayload() + Schema-Push.
 */
import sharp from 'sharp';
import { getPayload } from 'payload';
import config from './payload.config';
import { runSeed } from './seed';

const start = async () => {
  const payload = await getPayload({ config });

  // Seed nach Schema-Push — Tabellen sind jetzt garantiert da.
  try {
    await runSeed(payload);
  } catch (err: any) {
    payload.logger.error({
      msg: '[server] Seed failed (non-fatal, continuing)',
      err: err?.message ?? String(err),
      stack: err?.stack,
    });
  }

  // HTTP-Server starten. Payload 3 bietet createHTTPServer() auf der
  // Instanz — damit werden /admin, /api/* etc. gemountet.
  const anyPayload = payload as any;
  let server: any;
  if (typeof anyPayload.createHTTPServer === 'function') {
    server = await anyPayload.createHTTPServer();
  } else {
    const proto = Object.getPrototypeOf(payload);
    const instanceKeys = Object.keys(payload);
    const protoKeys = Object.getOwnPropertyNames(proto);
    payload.logger.error({
      msg: '[server] payload.createHTTPServer not found',
      instanceKeys: instanceKeys.join(', '),
      protoKeys: protoKeys.join(', '),
    });
    process.exit(1);
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    payload.logger.info(`[volkstanz-backend] listening on 0.0.0.0:${port}`);
  });
};

void sharp; // sharp wird in payload.config.ts an buildConfig übergeben

start().catch((err) => {
  console.error('[volkstanz-backend] Fatal startup error:', err);
  process.exit(1);
});
