/**
 * GET /api/robots
 *
 * Liefert die robots.txt aus der seo_settings-Collection.
 * Fallback: sicheres Standard-Set.
 */
import { Endpoint } from 'payload/config';

const FALLBACK = `User-agent: *
Disallow: /admin
Disallow: /*/admin

Sitemap: /sitemap.xml
`;

export const robotsEndpoint: Endpoint = {
  path: '/robots',
  method: 'get',
  handler: async (req, res) => {
    let robots = FALLBACK;
    try {
      const seo = await req.payload.find({
        collection: 'seo_settings',
        limit: 1,
        overrideAccess: true,
      });
      if (seo.docs[0]?.robots_txt) {
        robots = seo.docs[0].robots_txt;
      }
    } catch (err) {
      req.payload.logger.warn('[robots] seo_settings not readable, using fallback');
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(robots);
  },
};
