/**
 * Dünner Wrapper um die Payload CMS REST-API.
 *
 * Server-Kontext (SSR): PAYLOAD_URL (intern http://cms:3000)
 * Browser: PUBLIC_API_BASE (via Router)
 */

const SERVER_URL =
  import.meta.env.PAYLOAD_URL ?? process.env.PAYLOAD_URL ?? 'http://cms:3000';
const PUBLIC_URL =
  import.meta.env.PUBLIC_API_BASE ?? process.env.PUBLIC_API_BASE ?? '/verwaltung';

export function payloadBase(): string {
  return typeof window !== 'undefined' ? PUBLIC_URL : SERVER_URL;
}

export type ImageSize = 'thumb' | 'card' | 'hero' | 'og';

/** Populiertes Media-Dokument (wie es Payload bei depth >= 1 zurückgibt). */
export interface MediaDoc {
  id: string;
  filename?: string;
  url?: string;
  mimetype?: string;
  filesize?: number;
  width?: number;
  height?: number;
  sizes?: Partial<Record<ImageSize, { url?: string; width?: number; height?: number }>>;
}

/**
 * Asset-URL mit Größen-Option. Akzeptiert entweder eine MediaDoc (populiert),
 * eine string-ID (unpopuliert → Original-URL) oder undefined.
 */
export function assetUrl(
  source: MediaDoc | string | undefined,
  options?: { size?: ImageSize; width?: number; quality?: number; fallback?: string },
): string {
  if (!source) return options?.fallback ?? '';

  const base = payloadBase();

  if (typeof source === 'string') {
    return `${base}/api/media/file/${source}`;
  }

  if (options?.size && source.sizes?.[options.size]?.url) {
    const url = source.sizes[options.size]!.url!;
    return url.startsWith('http') ? url : `${base}${url}`;
  }

  if (source.url) {
    return source.url.startsWith('http') ? source.url : `${base}${source.url}`;
  }

  if (source.filename) {
    return `${base}/storage/${source.filename}`;
  }

  return options?.fallback ?? '';
}

/** GET-Helper — wirft nie, gibt null bei Fehler (für resiliente SSR-Seiten). */
export async function payloadGet<T = unknown>(
  path: string,
  query?: Record<string, string>,
): Promise<T | null> {
  const url = new URL(`${payloadBase()}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface PayloadResult<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
}

export interface GroupTranslation {
  lang: 'de' | 'en';
  description_md?: string;
  rehearsal_times?: string;
}

export interface GroupContact {
  type: 'website' | 'facebook' | 'instagram' | 'youtube' | 'mastodon' | 'other';
  label?: string;
  value: string;
}

export interface GroupImage {
  asset: string | MediaDoc;
  kind: 'hero' | 'logo' | 'team' | 'gallery';
  alt_text_de?: string;
  alt_text_en?: string;
  is_primary: boolean;
}

export interface Group {
  id: string | number;
  slug: string;
  name: string;
  founded_year?: number | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  region?: string | null;
  country: string;
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  translations?: GroupTranslation[];
  contacts?: GroupContact[];
  images?: GroupImage[];
  published_at?: string | null;
  createdAt?: string;
}

export interface ConsentVersion {
  id: string;
  type: 'tos' | 'privacy' | 'kug' | 'branding' | 'submission';
  version: number;
  body_md_de: string;
  body_md_en?: string;
  validFrom?: string;
  validUntil?: string | null;
}

export interface ContentEntry {
  id: string;
  key: string;
  category: string;
  translations: Array<{ lang: 'de' | 'en'; body: any }>;
}
