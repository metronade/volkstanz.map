-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  05-payload-helpers.sql                                            ║
-- ║                                                                    ║
-- ║  Hilfstabelle für die PUBLIC-Geometrie der Volkstanzgruppen.        ║
-- ║                                                                    ║
-- ║  Wird vom snap-geo Hook im Payload-Backend befüllt und vom          ║
-- ║  /public-coords Endpoint gelesen.                                  ║
-- ║                                                                    ║
-- ║  Warum separat? So bleibt die Original-Geometrie (lat/lng) sicher   ║
-- ║  in der groups-Tabelle und kann über Access-Control streng          ║
-- ║  kontrolliert werden — während die gerundete PUBLIC-Version         ║
-- ║    a) ein eigenen Index für Geo-Queries besitzt                     ║
-- ║    b) niemals aus Versehen geleakt werden kann (z. B. via populate) ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS groups_geom_public (
    group_id      integer PRIMARY KEY,
    lat           numeric NOT NULL,
    lng           numeric NOT NULL,
    privacy_level text NOT NULL,
    geom          geometry(Point, 4326)
                    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_geom_public_geom
    ON groups_geom_public USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_groups_geom_public_lat_lng
    ON groups_geom_public (lat, lng);
