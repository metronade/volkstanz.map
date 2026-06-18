/**
 * POST /api/submit-group
 *
 * Öffentliche Selbsteintragung einer Volkstanzgruppe.
 *
 * - Nur Status 'pending' wird akzeptiert (server-seitig erzwungen)
 * - IP/UA werden anonymisiert (Hash + Prefix) gespeichert
 * - Consent-Versionen müssen referenziert werden (Pflicht)
 * - Bild-Upload erfolgt vorab via /api/media, dann asset_id übergeben
 * - Audit-Log-Eintrag mit actorType='submitter'
 */
import { Endpoint } from 'payload';
import { sha256, ipPrefix, getIpFromRequest, getUaFromRequest } from '../hooks/anonymize-ip';

interface SubmissionBody {
  name: string;
  slug?: string;
  founded_year?: number;
  website?: string;
  email?: string;
  phone?: string;
  city?: string;
  region?: string;
  country?: string;
  lat: number;
  lng: number;
  privacy_level?: 'exact' | 'neighborhood' | 'city' | 'region';
  description_de?: string;
  description_en?: string;
  rehearsal_times_de?: string;
  image_asset_id?: string;
  consent_tos: string;       // ConsentVersion-ID
  consent_privacy: string;
  consent_kug: string;
  consent_branding?: boolean;
}

export const submitGroupEndpoint: Endpoint = {
  path: '/submit-group',
  method: 'post',
  handler: async (req, res) => {
    let body: SubmissionBody;
    try {
      body = req.body as SubmissionBody;
    } catch {
      return res.status(400).json({ error: 'invalid_body' });
    }

    // Pflichtfelder
    const required = ['name', 'lat', 'lng', 'consent_tos', 'consent_privacy', 'consent_kug'];
    for (const k of required) {
      if (body[k as keyof SubmissionBody] === undefined || body[k as keyof SubmissionBody] === '') {
        return res.status(422).json({ error: 'missing_field', field: k });
      }
    }

    // Validierung
    if (
      typeof body.lat !== 'number' || typeof body.lng !== 'number' ||
      body.lat < -90 || body.lat > 90 ||
      body.lng < -180 || body.lng > 180
    ) {
      return res.status(422).json({ error: 'invalid_coordinates' });
    }
    const validLevels = ['exact', 'neighborhood', 'city', 'region'];
    if (body.privacy_level && !validLevels.includes(body.privacy_level)) {
      return res.status(422).json({ error: 'invalid_privacy_level' });
    }

    const ip = getIpFromRequest(req);
    const ua = getUaFromRequest(req);

    // Slug aus Name generieren falls nicht gesetzt
    const slug =
      body.slug ||
      body.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

    try {
      const created = await req.payload.create({
        collection: 'groups',
        overrideAccess: true,
        data: {
          name: body.name,
          slug,
          founded_year: body.founded_year ?? null,
          website: body.website ?? null,
          email: body.email ?? null,
          phone: body.phone ?? null,
          city: body.city ?? null,
          region: body.region ?? null,
          country: body.country ?? 'DE',
          lat: body.lat,
          lng: body.lng,
          privacy_level: body.privacy_level ?? 'neighborhood',
          status: 'pending',  // erzwungen
          consent_tos: body.consent_tos,
          consent_privacy: body.consent_privacy,
          consent_kug: body.consent_kug,
          consent_branding: body.consent_branding ?? false,
          submitted_ip_hash: ip ? sha256(ip) : undefined,
          submitted_ip_prefix: ipPrefix(ip),
          submitted_ua_hash: ua ? sha256(ua) : undefined,
          translations: [
            {
              lang: 'de',
              description_md: body.description_de ?? '',
              rehearsal_times: body.rehearsal_times_de ?? '',
            },
            ...(body.description_en
              ? [{ lang: 'en', description_md: body.description_en }]
              : []),
          ],
          images: body.image_asset_id
            ? [{ asset: body.image_asset_id, kind: 'hero', is_primary: true }]
            : [],
        },
      });

      // Audit-Eintrag mit actorType='submitter'
      await req.payload.create({
        collection: 'audit_logs',
        overrideAccess: true,
        data: {
          ts: new Date().toISOString(),
          actorType: 'submitter',
          action: 'consent_given',
          entityType: 'groups',
          entityId: String(created.id),
          ipHash: ip ? sha256(ip) : undefined,
          ipPrefix: ipPrefix(ip),
          uaHash: ua ? sha256(ua) : undefined,
          consentVersionId: body.consent_tos,
          reason: 'Public-Submission via /submit-group',
        },
      });

      res.status(201).json({ id: created.id, slug: created.slug, status: 'pending' });
    } catch (err: any) {
      req.payload.logger.error('[submit-group] failed:', err);
      if (err?.code === '23505') {
        return res.status(409).json({ error: 'slug_taken' });
      }
      res.status(500).json({ error: 'internal' });
    }
  },
};
