/**
 * GET /api/groups.geojson
 *
 * Liefert alle *veröffentlichten* Gruppen als GeoJSON-FeatureCollection.
 * Nur die PUBLIC-Geometrie (gerundet) wird ausgeliefert – geom_raw bleibt
 * streng server-seitig.
 *
 * Optionaler Query-Parameter `slug=<slug>` → einzelne Gruppe (für Profilseiten).
 */
import type { APIRoute } from 'astro';
import { directusGet, assetUrl } from '@lib/directus';
import type { Group } from '@lib/types';

export const prerender = false;

interface DirectusGroupsResponse {
  data: Group[];
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');

  // Directus-Query: published groups + Übersetzungen + Bilder + Kontakte
  const fields = [
    'id', 'slug', 'name', 'founded_year', 'website', 'email', 'phone',
    'city', 'region', 'country', 'privacy_level', 'published_at',
    'translations.*',
    'images.asset_id', 'images.is_primary', 'images.kind',
    'images.alt_text_de', 'images.alt_text_en',
  ].join(',');

  const filter = slug
    ? JSON.stringify({ slug: { _eq: slug }, status: { _eq: 'published' } })
    : JSON.stringify({ status: { _eq: 'published' } });

  const data = await directusGet<DirectusGroupsResponse>('/items/groups', {
    fields,
    filter,
    limit: '1000',
  });

  if (!data || !data.data) {
    return new Response(
      JSON.stringify({ type: 'FeatureCollection', features: [] }),
      { status: 200, headers: { 'Content-Type': 'application/geo+json' } },
    );
  }

  // Für GeoJSON brauchen wir die Koordinaten aus der DB. Directus liefert
  // geom_public als WKT-String; wir parsen es hier server-seitig.
  // Einfacher: eine zweite Abfrage direkt über die Postgres-REST-API von Directus
  // (custom SQL-Endpoint). Fallback für MVP: Wir rufen /custom/coords ab.
  // Da das noch nicht existiert, generieren wir Platzhalter aus Directus' numerischen
  // X/Y-Spalten, die wir via Computed-Field in Directus exponieren.

  const coords = await directusGet<Record<string, { id: string; lng: number; lat: number }[]>>(
    '/custom/coords/public',
    {},
  );

  const coordMap = new Map<string, { lng: number; lat: number }>();
  if (coords && Array.isArray(coords)) {
    for (const c of coords) coordMap.set(c.id, { lng: c.lng, lat: c.lat });
  } else if (coords && typeof coords === 'object') {
    // Directus kehrt Custom-Endpoints oft als { data: [...] } zurück
    const arr = (coords as { data?: { id: string; lng: number; lat: number }[] }).data;
    if (arr) for (const c of arr) coordMap.set(c.id, { lng: c.lng, lat: c.lat });
  }

  const features = data.data
    .map((g): GeoJSON.Feature | null => {
      const c = coordMap.get(g.id);
      if (!c) return null;
      const primaryImage = g.images?.find((i) => i.is_primary) ?? g.images?.[0];

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: {
          id: g.id,
          slug: g.slug,
          name: g.name,
          city: g.city ?? '',
          country: g.country,
          founded_year: g.founded_year ?? null,
          website: g.website ?? '',
          email: g.email ?? '',
          phone: g.phone ?? '',
          image_url: primaryImage ? assetUrl(primaryImage.asset_id, { width: 400, quality: 70 }) : '',
        },
      };
    })
    .filter((f): f is GeoJSON.Feature => f !== null);

  return new Response(
    JSON.stringify({ type: 'FeatureCollection', features } satisfies GeoJSON.FeatureCollection),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/geo+json; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    },
  );
};
