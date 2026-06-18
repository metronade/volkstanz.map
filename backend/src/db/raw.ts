/**
 * Raw-SQL-Helper für den Payload postgres-Adapter.
 *
 * Der postgres-Adapter exposes pg nicht direkt. Wir greifen über den
 * internen `transactions`- oder `schema`-Pfad auf den Pool zu. Diese
 * Helper kapseln den Zugriff, sodass Endpoints/Hooks nicht an die
 * interne Struktur gekoppelt sind.
 */
import type { Payload } from 'payload';

interface PgLike {
  query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

function getPool(payload: Payload): PgLike | null {
  const db: any = (payload as any).db;
  // Payload 3.x postgres-Adapter
  const pool = db?.pool ?? db?.sessions?.[Symbol.for('drizzle:PgDriver')]?.pool;
  if (pool?.query) return pool as PgLike;

  // Fallback: drizzle's execute via db.drizzle
  const drizzle = db?.drizzle;
  if (drizzle?.execute) {
    return {
      async query<T = any>(text: string, params?: unknown[]) {
        const res = await drizzle.execute(text, params as any);
        return { rows: (res?.rows ?? res ?? []) as T[] };
      },
    };
  }
  return null;
}

export async function rawQuery<T = any>(
  payload: Payload,
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = getPool(payload);
  if (!pool) throw new Error('rawQuery: pg pool not available on payload.db');
  const result = await pool.query<T>(text, params);
  return result.rows;
}
