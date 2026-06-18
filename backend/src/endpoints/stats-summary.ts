/**
 * GET /api/stats-summary
 *
 * Aggregierte Statistiken für den Homepage-Hero:
 *   { groups, countries, regions }
 */
import { Endpoint } from 'payload/config';
import { rawQuery } from '../db/raw';

export const statsSummaryEndpoint: Endpoint = {
  path: '/stats-summary',
  method: 'get',
  handler: async (req, res) => {
    try {
      const rows = await rawQuery<{ groups: number; countries: number; regions: number }>(
        req.payload,
        `SELECT
           COUNT(*)                 AS groups,
           COUNT(DISTINCT country)  AS countries,
           COUNT(DISTINCT region)   AS regions
         FROM groups
         WHERE status = 'published'`,
      );
      const r = rows[0] ?? { groups: 0, countries: 0, regions: 0 };
      res.status(200).json({
        data: {
          groups: Number(r.groups ?? 0),
          countries: Number(r.countries ?? 0),
          regions: Number(r.regions ?? 0),
        },
      });
    } catch (err) {
      req.payload.logger.error('[stats-summary] failed:', err);
      res.status(500).json({ error: 'internal' });
    }
  },
};
