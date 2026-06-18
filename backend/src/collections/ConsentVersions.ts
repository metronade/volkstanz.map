/**
 * ConsentVersions — Versionierte AGB/Datenschutz/Bildnutzung/Branding-Texte.
 *
 * Jede Änderung wird als NEUE Version angelegt (revisionssicher). Alte
 * Versionen bleiben für Audit-Zwecke erhalten. Groups referenzieren die
 * jeweils geltende Version bei Eintragung.
 */
import { CollectionConfig } from 'payload';

export const ConsentVersions: CollectionConfig = {
  slug: 'consent_versions',
  admin: {
    useAsTitle: 'type',
    group: 'System',
    defaultColumns: ['type', 'version', 'validFrom', 'validUntil'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => user?.role === 'superadmin',
    delete: () => false,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ['tos', 'privacy', 'kug', 'branding', 'submission'],
      admin: { position: 'sidebar' },
    },
    { name: 'version', type: 'number', required: true, min: 1, defaultValue: 1 },
    {
      name: 'body_md_de',
      type: 'textarea',
      required: true,
      admin: { description: 'Markdown erlaubt' },
    },
    { name: 'body_md_en', type: 'textarea' },
    { name: 'validFrom', type: 'date', defaultValue: () => new Date() },
    { name: 'validUntil', type: 'date' },
  ],
};
