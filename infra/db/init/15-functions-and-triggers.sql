-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  15-functions-and-triggers.sql                                     ║
-- ║                                                                    ║
-- ║  Hilfsfunktionen:                                                  ║
-- ║    • audit_log()     — automatisch Audit-Eintrag bei Gruppenänderung║
-- ║    • generate_slug() — Fallback-Slug aus Gruppenname               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────
-- Audit-Log-Trigger: schreibt automatisch einen Eintrag, sobald eine
-- Gruppe angelegt/geändert/freigeschaltet wird.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION audit_group_change() RETURNS trigger AS $$
DECLARE
    v_action text;
    v_actor uuid;
    v_diff jsonb;
BEGIN
    v_action := TG_OP;

    -- Diff nur bei UPDATE/DELETE relevant
    IF v_action IN ('UPDATE','DELETE') THEN
        v_diff := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    ELSE
        v_diff := to_jsonb(NEW);
    END IF;

    -- Moderator aus connected Directus-User zu ermitteln wäre ideal via
    -- current_setting('app.actor_id', true). Setzt voraus, dass Directus
    -- diesen Setting vor Schreibvorgängen setzt. Falls nicht gesetzt → NULL.
    v_actor := NULLIF(current_setting('app.actor_id', true), '')::uuid;

    INSERT INTO audit_logs (
        ts, actor_type, actor_id, action, entity_type, entity_id, diff
    ) VALUES (
        now(),
        CASE WHEN v_actor IS NULL THEN 'system' ELSE 'admin' END,
        v_actor,
        CASE v_action
            WHEN 'INSERT' THEN 'create'
            WHEN 'UPDATE' THEN 'update'
            WHEN 'DELETE' THEN 'delete'
        END,
        'groups',
        NEW.id,
        v_diff
    );

    -- Bei Status-Wechsel auf 'published': published_at setzen
    IF v_action = 'UPDATE' AND OLD.status <> 'published' AND NEW.status = 'published' THEN
        NEW.published_at := now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_groups
    AFTER INSERT OR UPDATE OR DELETE ON groups
    FOR EACH ROW EXECUTE FUNCTION audit_group_change();

-- ─────────────────────────────────────────────────────────────────────
-- Auto-Slug-Fallback: Falls kein Slug angegeben, aus Name generieren.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION slugify(input text) RETURNS text AS $$
DECLARE
    v text;
BEGIN
    v := lower(input);
    -- Umlaute ersetzen
    v := replace(replace(replace(replace(v, 'ä','ae'), 'ö','oe'), 'ü','ue'), 'ß','ss');
    -- Sonderzeichen → -
    v := regexp_replace(v, '[^a-z0-9]+', '-', 'g');
    v := trim(both '-' from v);
    RETURN v;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION auto_slug_for_group() RETURNS trigger AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := slugify(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_slug
    BEFORE INSERT ON groups
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION auto_slug_for_group();
