/**
 * GET /api/public-coords
 *
 * Liefert { id, lat, lng } aller veröffentlichten Gruppen — aber nur die
 * gerundeten PUBLIC-Koordinaten (siehe snap-geo Hook). Raw-Koordinaten
 * bleiben server-seitig.
 */
import { Endpoint } from 'payload/config';

export const publicCoordsEndpoint: Endpoint = {
  path: '/public-coords',
  method: 'get',
  handler: async (req, res) => {
    try {
      const rows = await req.payload.db.drizzle.db.execute({
        sql: `
          SELECT g.id, gg.lat, gg.lng
          FROM groups g
          JOIN groups_geom_public gg ON gg.group_id = g.id
          WHERE g.status = 'published'
          ORDER BY g.published_at DESC;
        `,
      });
      res.status(200).json({ data: rows.rows });
    } catch (err) {
      req.payload.logger.error('[public-coords] failed:', err);
      res.status(500).json({ error: 'internal' });
    }
  },
};
