/**
 * Einstiegspunkt für die Payload-Applikation (Standalone-Server).
 * Lauscht auf 0.0.0.0:3000.
 *
 * Importiert das Config-Objekt direkt (statt als Pfad) — funktioniert
 * sowohl im dev-Modus (src/*.ts via tsx) als auch nach `payload build`
 * (dist/*.js), ohne dass wir den File-Pfad dynamisch auflösen müssen.
 */
import payload from 'payload';
import config from './payload.config';

const start = async () => {
  await payload.start({ config });
};

start().catch((err) => {
  console.error('[volkstanz-backend] Fatal startup error:', err);
  process.exit(1);
});
