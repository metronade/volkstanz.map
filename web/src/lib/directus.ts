/**
 * Dünner Wrapper um die Directus-REST-API.
 *
 * Im Server-Kontext (SSR-Endpoints, getStaticPaths) wird DIRECTUS_URL verwendet
 * (Container-internal: http://cms:8055). Im Browser wird PUBLIC_API_BASE
 * verwendet, das über den Router läuft.
 */

const SERVER_URL = import.meta.env.DIRECTUS_URL ?? process.env.DIRECTUS_URL ?? 'http://cms:8055';
const PUBLIC_URL = import.meta.env.PUBLIC_API_BASE ?? process.env.PUBLIC_API_BASE ?? '/verwaltung';

export function directusBase(): string {
  // Browser → externer Pfad, Server → interne URL
  if (typeof window !== 'undefined') {
    return PUBLIC_URL;
  }
  return SERVER_URL;
}

export interface DirectusError {
  errors: { message: string; extensions?: unknown }[];
}

/** Wurzel-URL für Asset-Aufrufe (Directus /assets). */
export function assetUrl(id: string | undefined, params?: { width?: number; quality?: number }): string {
  if (!id) return '';
  const base = `${directusBase()}/assets/${id}`;
  if (!params) return base;
  const q = new URLSearchParams();
  if (params.width) q.set('width', String(params.width));
  if (params.quality) q.set('quality', String(params.quality));
  return `${base}?${q.toString()}`;
}

/**
 * Führt einen GET-Request gegen die Directus-REST-API aus.
 * Gibt im Fehlerfall ein leeres Array oder `null` zurück – nie `throw`,
 * damit ein CMS-Ausfall nie die ganze Seite reißt.
 */
export async function directusGet<T = unknown>(
  path: string,
  query?: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): Promise<T | null> {
  const url = new URL(`${directusBase()}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  }
  try {
    const res = await fetchImpl(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json() as T | DirectusError;
    if (json && typeof json === 'object' && 'errors' in json) return null;
    return json as T;
  } catch {
    return null;
  }
}

/** SHA-256 (hex) für Audit-Log – IP-Hash, User-Agent-Hash. */
export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Kürzt eine IPv4 auf /24, IPv6 auf /48. */
export function ipPrefix(ip: string): string {
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::/48';
  }
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts.slice(0, 3).join('.')}.x/24`;
  return 'unknown';
}
