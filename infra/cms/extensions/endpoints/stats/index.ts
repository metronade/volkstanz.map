/**
 * GET /custom/stats/summary
 *
 * Aggregierte Statistiken für die Homepage:
 *   - Gruppen-Gesamtzahl
 *   - Anzahl Länder
 *   - Anzahl Regionen
 *
 * Antwort: { data: [{ groups: N, countries: M, regions: K }] }
 */
import type { EndpointExtensionContext } from 'directus/types/endpoint';

export default {
  id: 'stats',
  handler: (router, { database }: EndpointExtensionContext) => {
    router.get('/summary', async (_req, res) => {
      try {
        const db = database.schema('public');
        const row = await db('groups')
          .count('* as groups')
          .countDistinct('country as countries')
          .countDistinct('region as regions')
          .where('status', '=', 'published')
          .first();

        res.json({
          data: [{
            groups: Number(row?.groups ?? 0),
            countries: Number(row?.countries ?? 0),
            regions: Number(row?.regions ?? 0),
          }],
        });
      } catch (err) {
        res.status(500).json({
          errors: [{ message: 'failed to fetch stats', extensions: { err: String(err) } }],
        });
      }
    });
  },
};
