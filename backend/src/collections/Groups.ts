/**
 * Groups — Volkstanzgruppen.
 *
 * Geo-Handling: lat/lng als Number-Felder (Input über Submission-Form).
 * Ein afterChange-Hook schreibt die gerundete Position via Raw-SQL in die
 * Hilfsspalten `geom_public_lat`/`geom_public_lng`, die vom /public-coords-
 * Endpoint ausgelesen werden.
 *
 * Status-Werte:
 *   draft      — von Moderator/in angelegt, noch nicht freigegeben
 *   pending    — via Public-Submission eingegangen (wartet auf Freigabe)
 *   published  — sichtbar auf der Karte
 *   rejected   — abgelehnt (mit Begründung)
 *   archived   — archiviert (Gruppe aufgelöst etc.)
 */
import { CollectionConfig } from 'payload/types';
import { snapGeo } from '../hooks/snap-geo';
import { auditChange, auditDelete } from '../hooks/audit-change';
import { isAdminOrModerator, isPublicRead } from '../access/groups';

export const Groups: CollectionConfig = {
  slug: 'groups',
  admin: {
    useAsTitle: 'name',
    group: 'Inhalte',
    defaultColumns: ['name', 'city', 'country', 'status', 'createdAt'],
  },
  versions: {
    drafts: false, // einfacher Status-Workflow statt Drafts
  },
  access: {
    read: isPublicRead,       // Published → public; Rest → auth
    create: () => true,       // Public darf einreichen ( siehe submit-group-Endpoint )
    update: isAdminOrModerator,
    delete: ({ req: { user } }) => user?.role === 'superadmin' || user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 120,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL-Kennung der Gruppe, z. B. alpenrose-1923' },
    },
    {
      name: 'founded_year',
      type: 'number',
      admin: { position: 'sidebar' },
    },
    {
      name: 'website',
      type: 'url',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'city',
      type: 'text',
      index: true,
    },
    {
      name: 'region',
      type: 'text',
    },
    {
      name: 'country',
      type: 'text',
      defaultValue: 'DE',
      maxLength: 2,
      required: true,
    },

    // ── Geo ───────────────────────────────────────────────────────────
    {
      name: 'lat',
      type: 'number',
      required: true,
      admin: { description: 'Breitengrad (Original-Position, nur Moderator sichtbar)' },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: 'lng',
      type: 'number',
      required: true,
      admin: { description: 'Längengrad (Original-Position, nur Moderator sichtbar)' },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: 'privacy_level',
      type: 'select',
      required: true,
      defaultValue: 'neighborhood',
      options: [
        { label: 'Exakt (~100 m)',       value: 'exact' },
        { label: 'Stadtteil (~500 m)',   value: 'neighborhood' },
        { label: 'Stadt (~2 km)',        value: 'city' },
        { label: 'Region (~10 km)',      value: 'region' },
      ],
    },

    // ── Status & Moderation ──────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Draft',      value: 'draft' },
        { label: 'Pending',    value: 'pending' },
        { label: 'Published',  value: 'published' },
        { label: 'Rejected',   value: 'rejected' },
        { label: 'Archived',   value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'moderated_by',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'moderated_at',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'published_at',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'rejection_reason',
      type: 'textarea',
      admin: {
        condition: (data) => data?.status === 'rejected',
      },
    },

    // ── Consent-Referenzen ───────────────────────────────────────────
    {
      name: 'consent_tos',
      type: 'relationship',
      relationTo: 'consent_versions',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'consent_privacy',
      type: 'relationship',
      relationTo: 'consent_versions',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'consent_kug',
      type: 'relationship',
      relationTo: 'consent_versions',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'consent_branding',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },

    // ── Forensik (anonymisiert) ──────────────────────────────────────
    {
      name: 'submitted_ip_hash',
      type: 'text',
      hidden: true,
    },
    {
      name: 'submitted_ip_prefix',
      type: 'text',
      hidden: true,
    },
    {
      name: 'submitted_ua_hash',
      type: 'text',
      hidden: true,
    },

    // ── Relations (M2M) ───────────────────────────────────────────────
    {
      name: 'translations',
      type: 'array',
      fields: [
        { name: 'lang', type: 'select', required: true, options: ['de', 'en'] },
        { name: 'description_md', type: 'textarea' },
        { name: 'rehearsal_times', type: 'text' },
      ],
      admin: {
        description: 'Beschreibungen & Probenzeiten pro Sprache',
      },
    },
    {
      name: 'contacts',
      type: 'array',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: ['website', 'facebook', 'instagram', 'youtube', 'mastodon', 'other'],
        },
        { name: 'label', type: 'text' },
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        { name: 'asset', type: 'upload', relationTo: 'media', required: true },
        {
          name: 'kind',
          type: 'select',
          defaultValue: 'gallery',
          options: ['hero', 'logo', 'team', 'gallery'],
        },
        { name: 'alt_text_de', type: 'text' },
        { name: 'alt_text_en', type: 'text' },
        { name: 'is_primary', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
  hooks: {
    afterChange: [snapGeo, auditChange('groups')],
    afterDelete: [auditDelete('groups')],
  },
};
