/**
 * snap-geo Hook — rundet lat/lng in eine PUBLIC-Geometrie je nach
 * privacy_level und schreibt sie via Raw-SQL in eine separate Tabelle.
 *
 * Der /public-coords-Endpoint liest nur daraus, so dass rohe Koordinaten
 * niemals der Öffentlichkeit ausgesetzt werden.
 */
import type { CollectionAfterChangeHook } from 'payload/types';
import { rawQuery } from '../db/raw';

const SNAP_GRID: Record<string, number> = {
  exact:        0.001,   // ~100 m
  neighborhood: 0.005,   // ~500 m
  city:         0.02,    // ~2 km
  region:       0.1,     // ~10 km
};

export const snapGeo: CollectionAfterChangeHook = async ({ req, operation, doc }) => {
  if (operation !== 'create' && operation !== 'update') return doc;

  const lat = doc?.lat;
  const lng = doc?.lng;
  if (lat == null || lng == null) return doc;

  const privacyLevel = (doc.privacy_level as string) || 'neighborhood';
  const grid = SNAP_GRID[privacyLevel] ?? SNAP_GRID.neighborhood;

  const publicLat = Math.round(lat / grid) * grid;
  const publicLng = Math.round(lng / grid) * grid;

  try {
    await rawQuery(
      req.payload,
      `INSERT INTO groups_geom_public (group_id, lat, lng, privacy_level)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (group_id) DO UPDATE SET
         lat = EXCLUDED.lat,
         lng = EXCLUDED.lng,
         privacy_level = EXCLUDED.privacy_level,
         updated_at = now();`,
      [doc.id, publicLat, publicLng, privacyLevel],
    );
  } catch (err) {
    req.payload.logger.error('[snap-geo] failed to write geom_public:', err);
  }

  return doc;
};
