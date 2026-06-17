-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  10-core-tables.sql — Core-Schema für Volkstanz-Map                    ║
-- ║  Directus erkennt alle Tabellen automatisch als „Collections".         ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────
-- Rollen (für unser eigenes RBAC auf Audit-Metadaten-Ebene;
-- Directus hat parallel eigene Rollen/Policies, die wir spiegeln).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text        NOT NULL UNIQUE,
    label_de    text        NOT NULL,
    label_en    text,
    permissions jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────
-- Consent-Versionierung (revisionssicher!) —
-- Jede Änderung der AGB/Datenschutz/Bildnutzung wird als neue Version
-- angelegt; alte Versionen bleiben für Audit-Zwecke erhalten.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE consent_versions (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    type        text        NOT NULL CHECK (type IN ('tos','privacy','kug','branding','submission')),
    version     int         NOT NULL,
    body_md_de  text        NOT NULL,
    body_md_en  text,
    valid_from  timestamptz NOT NULL DEFAULT now(),
    valid_until timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (type, version)
);
CREATE INDEX idx_consent_type_active ON consent_versions(type, valid_from DESC);

-- ─────────────────────────────────────────────────────────────────────
-- Admin-Metadata — parallele Tabelle zu Directus' directus_users.
-- Hier speichern wir TOTP-Secret, Login-Fehlversuche etc. als
-- zusätzliche Audit-Information, ohne Directus zu patchen.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE admin_users (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    directus_user   uuid        NOT NULL UNIQUE,
    role_id         uuid        NOT NULL REFERENCES roles(id),
    totp_secret_enc bytea,                              -- AES-256 via App-Layer
    totp_enabled    boolean     NOT NULL DEFAULT false,
    failed_logins   int         NOT NULL DEFAULT 0,
    locked_until    timestamptz,
    last_login_at   timestamptz,
    last_login_ip   text,                               -- gekürzt /24
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_role ON admin_users(role_id);

-- ─────────────────────────────────────────────────────────────────────
-- Audit-Log — revisionssicher, IP anonymisiert als SHA-256-Hash.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id                 bigserial    PRIMARY KEY,
    ts                 timestamptz  NOT NULL DEFAULT now(),
    actor_type         text         NOT NULL CHECK (actor_type IN ('system','admin','submitter','public')),
    actor_id           uuid,
    action             text         NOT NULL,
    entity_type        text,
    entity_id          uuid,
    ip_hash            text,
    ip_prefix          text,
    ua_hash            text,
    consent_version_id uuid         REFERENCES consent_versions(id),
    diff               jsonb,
    reason             text
);
CREATE INDEX idx_audit_actor  ON audit_logs(actor_id, ts DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action, ts DESC);
CREATE INDEX idx_audit_ts     ON audit_logs(ts DESC);

-- ─────────────────────────────────────────────────────────────────────
-- CMS-Content (statische Texte, Buttons, Überschriften) —
-- Übersetzung in cms_translations.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE cms_content (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key        text        NOT NULL UNIQUE,         -- z. B. 'home.hero.title'
    category   text        NOT NULL DEFAULT 'general',
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cms_translations (
    content_id uuid   NOT NULL REFERENCES cms_content(id) ON DELETE CASCADE,
    lang       text   NOT NULL,
    body_md    text,
    body_jsonb jsonb,
    PRIMARY KEY (content_id, lang)
);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cms_touch
    BEFORE UPDATE ON cms_content
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- Volkstanz-Gruppen — Haupttabelle.
-- geom_public wird AUTOMATISCH aus geom_raw + privacy_level berechnet.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE groups (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                text        NOT NULL UNIQUE,
    name                text        NOT NULL,
    founded_year        int,
    website             text,
    email               text,
    phone               text,

    -- Geometrie
    geom_raw            geometry(Point, 4326) NOT NULL,
    privacy_level       text        NOT NULL DEFAULT 'neighborhood'
                                    CHECK (privacy_level IN ('exact','neighborhood','city','region')),
    geom_public         geometry(Point, 4326)
                                    GENERATED ALWAYS AS (
                                        CASE privacy_level
                                            WHEN 'exact'        THEN ST_SnapToGrid(geom_raw, 0.001)
                                            WHEN 'neighborhood' THEN ST_SnapToGrid(geom_raw, 0.005)
                                            WHEN 'city'         THEN ST_SnapToGrid(geom_raw, 0.02)
                                            WHEN 'region'       THEN ST_SnapToGrid(geom_raw, 0.1)
                                        END
                                    ) STORED,
    city                text,
    region              text,
    country             text        NOT NULL DEFAULT 'DE',

    -- Status & Moderation
    status              text        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('draft','pending','published','rejected','archived')),
    moderated_by        uuid        REFERENCES admin_users(id),
    moderated_at        timestamptz,
    rejection_reason    text,

    -- Consent-Referenzen (welche Version galt bei Eintragung?)
    consent_tos_v       uuid        NOT NULL REFERENCES consent_versions(id),
    consent_privacy_v   uuid        NOT NULL REFERENCES consent_versions(id),
    consent_kug_v       uuid        NOT NULL REFERENCES consent_versions(id),

    -- Forensik (anonymisiert)
    submitted_ip_hash   text,
    submitted_ip_prefix text,
    submitted_ua_hash   text,

    -- Timestamps
    created_at          timestamptz NOT NULL DEFAULT now(),
    published_at        timestamptz
);

CREATE INDEX idx_groups_status      ON groups(status);
CREATE INDEX idx_groups_geom_public ON groups USING GIST (geom_public);
CREATE INDEX idx_groups_name_trgm   ON groups USING GIN (name gin_trgm_ops);
CREATE INDEX idx_groups_city        ON groups(city);
CREATE INDEX idx_groups_published   ON groups(published_at DESC) WHERE status = 'published';

-- ─────────────────────────────────────────────────────────────────────
-- Gruppen-Übersetzungen (Beschreibung, Probenzeiten in der jeweiligen Sprache)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE group_translations (
    group_id         uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    lang             text NOT NULL,
    description_md   text,
    rehearsal_times  text,
    PRIMARY KEY (group_id, lang)
);

-- ─────────────────────────────────────────────────────────────────────
-- Bilder einer Gruppe (Referenz auf Directus-File-Library)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE group_images (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    asset_id    uuid        NOT NULL,                       -- FK directus_files
    kind        text        NOT NULL DEFAULT 'gallery'
                                CHECK (kind IN ('hero','logo','team','gallery')),
    alt_text_de text,
    alt_text_en text,
    is_primary  boolean     NOT NULL DEFAULT false,
    sort_order  int         NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_group_images_group ON group_images(group_id, sort_order);

-- ─────────────────────────────────────────────────────────────────────
-- Kontaktmöglichkeiten jenseits von E-Mail/Telefon (Social, Messenger)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE group_contacts (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    type     text NOT NULL CHECK (type IN ('website','facebook','instagram','youtube','mastodon','other')),
    label    text,
    value    text NOT NULL,
    sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_group_contacts_group ON group_contacts(group_id);

-- ─────────────────────────────────────────────────────────────────────
-- SEO-Settings (Singleton – nur eine Zeile, id = 1)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE seo_settings (
    id                  int  PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    robots_txt          text NOT NULL DEFAULT
        'User-agent: *\nDisallow: /admin\nDisallow: /*/admin\n\nSitemap: https://volkstanz.example.org/sitemap.xml',
    sitemap_include_all boolean NOT NULL DEFAULT true,
    default_og_image    uuid,
    favicon_asset_id    uuid,
    default_locale      text NOT NULL DEFAULT 'de',
    site_title_de       text NOT NULL DEFAULT 'Volkstanz-Karte',
    site_title_en       text NOT NULL DEFAULT 'Folk Dance Map',
    site_description_de text,
    site_description_en text,
    updated_at          timestamptz NOT NULL DEFAULT now(),
    updated_by          uuid REFERENCES admin_users(id)
);
CREATE TRIGGER trg_seo_touch
    BEFORE UPDATE ON seo_settings
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- View: Moderations-Queue — alle Gruppen im Status 'pending'.
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_submissions_queue AS
    SELECT
        g.id, g.slug, g.name, g.city, g.country,
        g.privacy_level, g.status, g.created_at,
        ST_X(g.geom_public) AS lng,
        ST_Y(g.geom_public) AS lat
    FROM groups g
    WHERE g.status = 'pending'
    ORDER BY g.created_at ASC;
