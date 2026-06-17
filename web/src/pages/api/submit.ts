/**
 * POST /api/submit
 *
 * Öffentliche Eintragung einer Volkstanzgruppe. Schreibt in `groups`
 * mit status='pending' und erzeugt einen Audit-Log-Eintrag.
 *
 * Direkter Schreibzugriff auf Directus ohne Admin-Auth: das funktioniert nur,
 * weil die Collection `groups` in Directus so konfiguriert ist, dass die
 * Rolle „Public" create-Rechte *nur* für status='pending' hat. Das passieren
 * wir im Admin-Setup einmalig.
 */
import type { APIRoute } from 'astro';
import { directusBase, sha256, ipPrefix } from '@lib/directus';

export const prerender = false;

interface SubmissionBody {
  name: string;
  slug: string;
  founded_year?: number;
  website?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  description_de?: string;
  description_en?: string;
  rehearsal_times_de?: string;
  lat: number;
  lng: number;
  privacy_level: 'exact' | 'neighborhood' | 'city' | 'region';
  image_asset_id?: string;
  consent_tos_v: string;
  consent_privacy_v: string;
  consent_kug_v: string;
  consent_branding?: boolean;
}

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  let body: SubmissionBody;
  try {
    body = await request.json() as SubmissionBody;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Pflichtfelder prüfen
  const required = ['name', 'slug', 'lat', 'lng', 'privacy_level', 'consent_tos_v', 'consent_privacy_v', 'consent_kug_v'];
  for (const k of required) {
    if (body[k as keyof SubmissionBody] === undefined || body[k as keyof SubmissionBody] === '') {
      return json({ error: 'missing_field', field: k }, 422);
    }
  }

  // Privacy-Level prüfen
  const validLevels = ['exact', 'neighborhood', 'city', 'region'];
  if (!validLevels.includes(body.privacy_level)) {
    return json({ error: 'invalid_privacy_level' }, 422);
  }

  // Geo-Koordinaten validieren
  if (
    typeof body.lat !== 'number' || typeof body.lng !== 'number' ||
    body.lat < -90 || body.lat > 90 ||
    body.lng < -180 || body.lng > 180
  ) {
    return json({ error: 'invalid_coordinates' }, 422);
  }

  // IP anonymisieren
  const rawIp = clientAddress || request.headers.get('x-forwarded-for') || '0.0.0.0';
  const ua = request.headers.get('user-agent') || '';
  const ipHash = await sha256(rawIp + ':' + new Date().toISOString().slice(0, 10));
  const ipPref = ipPrefix(rawIp);
  const uaHash = await sha256(ua);

  // Directus-Payload bauen
  const payload = {
    name: body.name,
    slug: body.slug,
    founded_year: body.founded_year ?? null,
    website: body.website ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    city: body.city ?? null,
    country: body.country ?? 'DE',
    // Directus nimmt Geometrie als WKT entgegen
    geom_raw: `SRID=4326;POINT(${body.lng} ${body.lat})`,
    privacy_level: body.privacy_level,
    status: 'pending',
    consent_tos_v: body.consent_tos_v,
    consent_privacy_v: body.consent_privacy_v,
    consent_kug_v: body.consent_kug_v,
    submitted_ip_hash: ipHash,
    submitted_ip_prefix: ipPref,
    submitted_ua_hash: uaHash,
    translations: [
      { lang: 'de', description_md: body.description_de ?? '', rehearsal_times: body.rehearsal_times_de ?? '' },
      ...(body.description_en ? [{ lang: 'en', description_md: body.description_en }] : []),
    ],
    images: body.image_asset_id
      ? [{ asset_id: body.image_asset_id, kind: 'hero', is_primary: true }]
      : [],
  };

  const res = await fetch(`${directusBase()}/items/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Direkte Public-Create-Rechte sind via Directus-Policy gesetzt.
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[submit] directus error', res.status, errText);
    return json({ error: 'submission_failed' }, 502);
  }

  // Erfolg – zur Danke-Seite weiterleiten
  return redirect('/danke', 303);
};

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
