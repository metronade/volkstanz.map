-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  00-extensions.sql — PostgreSQL-Erweiterungen für Volkstanz-Map   ║
-- ╚══════════════════════════════════════════════════════════════════╝
CREATE EXTENSION IF NOT EXISTS postgis;     -- Geometrie, GIST-Index, ST_SnapToGrid
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- fuzzy search (Gruppennamen)
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- GIST + BTree kombiniert (Audit-Log)
