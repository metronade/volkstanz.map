-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  20-seed.sql — Bootstrap: Rollen, Consent-Versionen, SEO-Singleton     ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── Rollen ─────────────────────────────────────────────────────────────
INSERT INTO roles (slug, label_de, label_en, permissions) VALUES
    ('superadmin', 'Super-Admin',    'Super Admin',    '{"all": true}'::jsonb),
    ('admin',      'Administrator',  'Administrator',  '{"groups": {"publish": true, "delete": true}, "cms": true, "seo": true}'::jsonb),
    ('moderator',  'Moderator',      'Moderator',      '{"groups": {"publish": true, "delete": false}, "cms": false, "seo": false}'::jsonb),
    ('translator', 'Übersetzer',     'Translator',     '{"groups": {"publish": false, "delete": false}, "cms": true, "seo": false}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ── Initiale Consent-Versionen (v1) ───────────────────────────────────
-- Diese Texte sollten nach erstem Start im Admin-UI angepasst werden.
INSERT INTO consent_versions (type, version, body_md_de, body_md_en) VALUES
    (
     'tos',
     1,
     '# Nutzungsbedingungen

Mit der Eintragung in die Volkstanz-Karte bestätige ich, dass die angegebenen Daten korrekt sind und ich berechtigt bin, die Gruppe öffentlich zu repräsentieren. Die Betreiber der Plattform behalten sich vor, Eintragungen ohne Begründung zu entfernen.',
     '# Terms of Service

By submitting an entry to the Folk Dance Map, I confirm that the provided data is correct and that I am authorized to publicly represent the group. The platform operators reserve the right to remove entries without giving reasons.'
    ),
    (
     'privacy',
     1,
     '# Datenschutzerklärung

Die eingegebenen Daten (Gruppenname, Ort, Kontaktdaten, Bild) werden zum Zweck der öffentlichen Darstellung auf dieser Plattumg verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Die Einwilligung kann jederzeit durch Kontaktaufnahme widerrufen werden. IP-Adressen werden als anonymisierte Hash-Werte gespeichert (Art. 6 Abs. 1 lit. f DSGVO).',
     '# Privacy Policy

The entered data (group name, location, contact details, image) will be processed for the purpose of public display on this platform. The legal basis is Art. 6 (1) lit. a GDPR (consent). Consent can be withdrawn at any time by contacting us. IP addresses are stored as anonymized hash values (Art. 6 (1) lit. f GDPR).'
    ),
    (
     'kug',
     1,
     '# Bildnutzung & KunstUrhG § 22

Ich bestätige, dass ich die Nutzungsrechte an dem hochgeladenen Bild besitze und **alle abgebildeten Personen** in der Veröffentlichung auf dieser Plattform eingewilligt haben (§ 22 KUG). Die Betreiber sind von etwaigen Ansprüchen Dritter frei zu stellen.',
     '# Image Use & German Art Copyright Act § 22

I confirm that I hold the usage rights for the uploaded image and that **all persons depicted** have consented to its publication on this platform (§ 22 KUG). The operators shall be held harmless from any claims by third parties.'
    ),
    (
     'submission',
     1,
     'Ich habe die Nutzungsbedingungen, die Datenschutzerklärung und die Bildnutzungs-Bedingungen gelesen und akzeptiere sie.',
     'I have read the terms of service, the privacy policy and the image use conditions and accept them.'
    )
ON CONFLICT (type, version) DO NOTHING;

-- ── SEO-Singleton ─────────────────────────────────────────────────────
INSERT INTO seo_settings (id, site_description_de, site_description_en) VALUES
    (
     1,
     'Karte der Volkstanzgruppen im DACH-Raum und weltweit.',
     'Map of folk dance groups in the DACH region and worldwide.'
    )
ON CONFLICT (id) DO NOTHING;
