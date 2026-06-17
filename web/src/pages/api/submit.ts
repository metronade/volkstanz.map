/**
 * POST /api/submit
 *
 * Proxy an den Payload-Backend-Endpoint /api/submit-group.
 * Astro übernimmt nur die Form-Daten-Verarbeitung und reicht als JSON weiter.
 */
import type { APIRoute } from 'astro';
import { payloadBase } from '@lib/payload';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Pflichtfelder prüfen (vorab, für schnelle 422 ohne Backend-Roundtrip)
  const required = ['name', 'lat', 'lng', 'consent_tos', 'consent_privacy', 'consent_kug'];
  for (const k of required) {
    if (body[k] === undefined || body[k] === '') {
      return json({ error: 'missing_field', field: k }, 422);
    }
  }

  // An Payload weiterleiten
  const res = await fetch(`${payloadBase()}/api/submit-group`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: 'upstream_error' }));
    return json(errBody, res.status as 400 | 401 | 409 | 422 | 500);
  }

  return redirect('/danke', 303);
};

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
