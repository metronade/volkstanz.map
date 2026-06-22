/**
 * GET /api/public-coords
 *
 * Liefert { id, lat, lng } aller veröffentlichten Gruppen — aber nur die
 * gerundeten PUBLIC-Koordinaten (siehe snap-geo Hook). Raw-Koordinaten
 * bleiben server-seitig.
 */
import type { Endpoint } from 'payload';
import { rawQuery } from '../db/raw';

export const publicCoordsEndpoint: Endpoint = {
  path: '/public-coords',
  method: 'get',
  handler: async (req) => {
    try {
      const rows = await rawQuery<{ id: number; lat: number; lng: number }>(
        req.payload,
        `SELECT g.id, gg.lat, gg.lng
         FROM groups g
         JOIN groups_geom_public gg ON gg.group_id = g.id
         WHERE g.status = 'published'
         ORDER BY g.published_at DESC NULLS LAST`,
      );
      return Response.json({ data: rows });
    } catch (err) {
      req.payload.logger.error('[public-coords] failed:', err);
      return Response.json({ error: 'internal' }, { status: 500 });
    }
  },
};
