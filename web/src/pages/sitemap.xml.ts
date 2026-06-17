/**
 * GET /sitemap.xml
 *
 * Generiert sitemap.xml dynamisch:
 *   - Statische Seiten (Home, was-ist, gruppe-eintragen, impressum, datenschutz)
 *   - Alle veröffentlichten Gruppen
 *
 * Respectiert seo_settings.sitemap_include_all.
 */
import type { APIRoute } from 'astro';
import { directusGet } from '@lib/directus';
import type { Group } from '@lib/types';

export const prerender = false;

const STATIC_PATHS = [
  '',
  'was-ist',
  'gruppe-eintragen',
  'impressum',
  'datenschutz',
];

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site?.toString() ?? process.env.SITE_URL ?? '').replace(/\/$/, '');
  if (!baseUrl) {
    return new Response('<!-- SITE_URL not configured -->', { status: 500 });
  }

  // SEO-Settings abrufen
  const seo = await directusGet<{ data: { sitemap_include_all: boolean } | null }>(
    '/items/seo_settings',
    { single: '1', fields: 'sitemap_include_all' },
  );
  const includeAll = seo?.data?.sitemap_include_all ?? true;

  const urls: string[] = [];
  for (const p of STATIC_PATHS) {
    urls.push(`${baseUrl}/${p}`);
    if (includeAll) urls.push(`${baseUrl}/en/${p}`);
  }

  // Gruppen
  const groups = await directusGet<{ data: Pick<Group, 'slug' | 'published_at'>[] }>(
    '/items/groups',
    {
      filter: JSON.stringify({ status: { _eq: 'published' } }),
      fields: 'slug,published_at',
      limit: '5000',
    },
  );
  if (groups?.data) {
    for (const g of groups.data) {
      urls.push(`${baseUrl}/gruppen/${g.slug}`);
      if (includeAll) urls.push(`${baseUrl}/en/gruppen/${g.slug}`);
    }
  }

  const lastmod = new Date().toISOString().slice(0, 10);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}
