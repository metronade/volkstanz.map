/**
 * GET /api/groups.geojson
 *
 * Liefert alle veröffentlichten Gruppen als GeoJSON-FeatureCollection.
 * Koordinaten stammen aus der groups_geom_public-Tabelle (gerundet).
 */
import type { APIRoute } from 'astro';
import { payloadGet, assetUrl, type Group, type PayloadResult } from '@lib/payload';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');

  const where = slug
    ? { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] }
    : { status: { equals: 'published' } };

  const [groups, coords] = await Promise.all([
    payloadGet<PayloadResult<Group>>('/api/groups', {
      where: JSON.stringify(where),
      limit: '1000',
    }),
    payloadGet<{ data: Array<{ id: number; lat: number; lng: number }> }>('/api/public-coords'),
  ]);

  const coordMap = new Map<string, { lng: number; lat: number }>();
  if (coords?.data) {
    for (const c of coords.data) coordMap.set(String(c.id), { lng: c.lng, lat: c.lat });
  }

  const features = (groups?.docs ?? [])
    .map((g): GeoJSON.Feature | null => {
      const c = coordMap.get(String(g.id));
      if (!c) return null;

      const heroImg = g.images?.find((i) => i.is_primary) ?? g.images?.[0];

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: {
          id: String(g.id),
          slug: g.slug,
          name: g.name,
          city: g.city ?? '',
          country: g.country,
          founded_year: g.founded_year ?? null,
          website: g.website ?? '',
          email: g.email ?? '',
          phone: g.phone ?? '',
          image_url: heroImg ? assetUrl(heroImg.asset, { size: 'card' }) : '',
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
