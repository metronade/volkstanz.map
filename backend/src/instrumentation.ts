/**
 * Next.js Instrumentation-Hook — läuft einmal beim Server-Startup, BEVOR
 * Requests angenommen werden.
 *
 * Pipeline:
 *   1. getPayload mit disableOnInit:true → Payload init OHNE Seed
 *   2. payload.db.migrate() → wendet alle committeten Migrationen an
 *   3. runSeed(payload) → idempotenter Seed (Consent v1, SEO, Admin-User)
 *
 * Ohne disableOnInit würde onInit (Seed) vor der Migration laufen und
 * an "relation consent_versions does not exist" scheitern.
 *
 * NEXT_RUNTIME='nodejs' filtert Edge-Runtime aus.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
  const { runSeed } = await import('./seed')

  const payload = await getPayload({ config, disableOnInit: true } as any)

  try {
    await (payload.db as any).migrate()
    payload.logger.info('[instrumentation] migrations applied')
  } catch (err: any) {
    payload.logger.error({
      msg: '[instrumentation] migration failed (non-fatal, continuing)',
      err: err?.message ?? String(err),
      stack: err?.stack,
    })
  }

  if (process.env.PAYLOAD_DISABLE_SEED === 'true') return
  try {
    await runSeed(payload)
    payload.logger.info('[instrumentation] seed complete')
  } catch (err: any) {
    payload.logger.error({
      msg: '[instrumentation] seed failed (non-fatal, continuing)',
      err: err?.message ?? String(err),
      stack: err?.stack,
    })
  }
}
