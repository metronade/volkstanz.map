/**
 * GET /api/sitemap
 *
 * Generiert sitemap.xml aus statischen Pfaden + allen veröffentlichten
 * Gruppen. Berücksichtigt seo_settings.sitemap_include_all (für /en/*).
 */
import { Endpoint } from 'payload/config';

const STATIC_PATHS = ['', 'was-ist', 'gruppe-eintragen', 'impressum', 'datenschutz'];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

export const sitemapEndpoint: Endpoint = {
  path: '/sitemap',
  method: 'get',
  handler: async (req, res) => {
    // Base-URL aus Site-URL-Header (vom Router) oder env
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const proto = (req.headers.get('x-forwarded-proto') as string) || 'http';
    const baseUrl = (process.env.SITE_URL || (host ? `${proto}://${host}` : '')).replace(/\/$/, '');

    let includeAll = true;
    try {
      const seo = await req.payload.find({
        collection: 'seo_settings',
        limit: 1,
        overrideAccess: true,
      });
      if (typeof seo.docs[0]?.sitemap_include_all === 'boolean') {
        includeAll = seo.docs[0].sitemap_include_all;
      }
    } catch { /* fallback to true */ }

    const urls: string[] = [];
    for (const p of STATIC_PATHS) {
      urls.push(`${baseUrl}/${p}`.replace(/\/+$/, '') || baseUrl);
      if (includeAll) urls.push(`${baseUrl}/en/${p}`.replace(/\/+$/, ''));
    }

    try {
      const groups = await req.payload.find({
        collection: 'groups',
        where: { status: { equals: 'published' } },
        limit: 5000,
        overrideAccess: true,
      });
      for (const g of groups.docs) {
        urls.push(`${baseUrl}/gruppen/${g.slug}`);
        if (includeAll) urls.push(`${baseUrl}/en/gruppen/${g.slug}`);
      }
    } catch { /* groups not yet migrated */ }

    const lastmod = new Date().toISOString().slice(0, 10);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  },
};
