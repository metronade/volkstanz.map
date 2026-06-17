/**
 * Seed — legt initiale Consent-Versionen, SEO-Singleton und optional
 * einen ersten Admin-User an.
 *
 * Wird automatisch via `onInit` in payload.config.ts beim ersten Start
 * ausgeführt. Aufruf von Kommandozeile: `npm run seed`.
 */
import type { Payload } from 'payload';

export async function runSeed(payload: Payload): Promise<void> {
  // ── Consent-Versionen v1 ──────────────────────────────────────────
  const consents = await payload.find({
    collection: 'consent_versions',
    limit: 1,
    overrideAccess: true,
  });

  if (consents.totalDocs === 0) {
    payload.logger.info('[seed] creating consent v1 entries...');
    await payload.create({
      collection: 'consent_versions',
      overrideAccess: true,
      data: {
        type: 'tos',
        version: 1,
        body_md_de: `# Nutzungsbedingungen

Mit der Eintragung in die Volkstanz-Karte bestätige ich, dass die angegebenen Daten korrekt sind und ich berechtigt bin, die Gruppe öffentlich zu repräsentieren. Die Betreiber der Plattform behalten sich vor, Eintragungen ohne Begründung zu entfernen.`,
        body_md_en: `# Terms of Service

By submitting an entry to the Folk Dance Map, I confirm that the provided data is correct and that I am authorized to publicly represent the group. The platform operators reserve the right to remove entries without giving reasons.`,
      },
    });

    await payload.create({
      collection: 'consent_versions',
      overrideAccess: true,
      data: {
        type: 'privacy',
        version: 1,
        body_md_de: `# Datenschutzerklärung

Die eingegebenen Daten (Gruppenname, Ort, Kontaktdaten, Bild) werden zum Zweck der öffentlichen Darstellung auf dieser Plattform verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Die Einwilligung kann jederzeit durch Kontaktaufnahme widerrufen werden. IP-Adressen werden als anonymisierte Hash-Werte gespeichert (Art. 6 Abs. 1 lit. f DSGVO).`,
        body_md_en: `# Privacy Policy

The entered data (group name, location, contact details, image) will be processed for the purpose of public display on this platform. The legal basis is Art. 6 (1) lit. a GDPR (consent). Consent can be withdrawn at any time. IP addresses are stored as anonymized hash values (Art. 6 (1) lit. f GDPR).`,
      },
    });

    await payload.create({
      collection: 'consent_versions',
      overrideAccess: true,
      data: {
        type: 'kug',
        version: 1,
        body_md_de: `# Bildnutzung & KunstUrhG § 22

Ich bestätige, dass ich die Nutzungsrechte an dem hochgeladenen Bild besitze und **alle abgebildeten Personen** in der Veröffentlichung auf dieser Plattform eingewilligt haben (§ 22 KUG).`,
        body_md_en: `# Image Use & German Art Copyright Act § 22

I confirm that I hold the usage rights for the uploaded image and that **all persons depicted** have consented to its publication on this platform (§ 22 KUG).`,
      },
    });

    await payload.create({
      collection: 'consent_versions',
      overrideAccess: true,
      data: {
        type: 'submission',
        version: 1,
        body_md_de: 'Ich habe die Nutzungsbedingungen, die Datenschutzerklärung und die Bildnutzungs-Bedingungen gelesen und akzeptiere sie.',
        body_md_en: 'I have read the terms of service, the privacy policy and the image use conditions and accept them.',
      },
    });
  }

  // ── SEO-Singleton ────────────────────────────────────────────────
  const seo = await payload.find({
    collection: 'seo_settings',
    limit: 1,
    overrideAccess: true,
  });

  if (seo.totalDocs === 0) {
    payload.logger.info('[seed] creating seo_settings singleton...');
    await payload.create({
      collection: 'seo_settings',
      overrideAccess: true,
      data: {
        id: 1,
        site_description_de: 'Karte der Volkstanzgruppen im DACH-Raum und weltweit.',
        site_description_en: 'Map of folk dance groups in the DACH region and worldwide.',
      },
    });
  }

  // ── Initialer Admin-User (nur wenn users-Tabelle leer) ───────────
  const users = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
  });

  if (
    users.totalDocs === 0 &&
    process.env.INITIAL_ADMIN_EMAIL &&
    process.env.INITIAL_ADMIN_PASSWORD
  ) {
    payload.logger.info('[seed] creating initial admin user...');
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: process.env.INITIAL_ADMIN_NAME || 'Administrator',
        email: process.env.INITIAL_ADMIN_EMAIL,
        password: process.env.INITIAL_ADMIN_PASSWORD,
        role: 'superadmin',
      },
    });
  }

  payload.logger.info('[seed] done.');
}

// ── Standalone-Aufruf (npm run seed) ──────────────────────────────
async function main() {
  const { getPayload } = await import('payload');
  const { default: config } = await import('./payload.config');
  const payload = await getPayload({ config });
  await runSeed(payload);
  process.exit(0);
}

// Nur direkt als Skript ausführen, nicht beim Import (z. B. durch onInit).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  });
}
