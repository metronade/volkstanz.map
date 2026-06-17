/**
 * GET /custom/coords/public
 *
 * Liefert { id, lng, lat } für alle veröffentlichten Gruppen.
 * Wegen PostGIS-Geometry in `geom_public` nicht über die Standard-Items-API
 * abrufbar — das ist der Custom-Endpoint dafür.
 *
 * Router: /custom/* wird von Directus automatisch gemountet.
 */
import type { EndpointExtensionContext } from 'directus/types/endpoint';

export default {
  id: 'coords',
  handler: (router, { services, database }: EndpointExtensionContext) => {
    router.get('/public', async (req, res) => {
      try {
        const db = database.schema('public');
        const rows = await db
          .select('id', db.raw('ST_X(geom_public) AS lng'), db.raw('ST_Y(geom_public) AS lat'))
          .from('groups')
          .where('status', '=', 'published');

        res.json({ data: rows });
      } catch (err) {
        res.status(500).json({
          errors: [{ message: 'failed to fetch public coords', extensions: { err: String(err) } }],
        });
      }
    });
  },
};
