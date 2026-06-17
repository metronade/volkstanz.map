/**
 * Content — Statische UI-Texte (Headlines, Buttons, Labels).
 * Übersetzung in ContentTranslations.
 */
import { CollectionConfig } from 'payload/types';

export const Content: CollectionConfig = {
  slug: 'content',
  admin: {
    useAsTitle: 'key',
    group: 'Inhalte',
    defaultColumns: ['key', 'category', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'superadmin' || user?.role === 'admin',
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Eindeutiger Schlüssel, z. B. legal.imprint oder home.hero.title' },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'general',
      options: ['general', 'legal', 'home', 'submit', 'about', 'group', 'footer', 'nav'],
    },
    {
      name: 'translations',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'lang', type: 'select', required: true, options: ['de', 'en'] },
        {
          name: 'body',
          type: 'richText',
          editor: 'lexical',
        },
      ],
    },
  ],
};
