/**
 * Media — Upload-Library für Bilder, Logos, Favicon, OG-Image.
 */
import { CollectionConfig } from 'payload/types';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticURL: '/storage',
    staticDir: '../storage',
    useLocalStorage: true,
    imageSizes: [
      { name: 'thumb',    width: 200,  height: 200, position: 'centre' },
      { name: 'card',     width: 600,  height: 450, position: 'centre' },
      { name: 'hero',     width: 1600, height: 900, position: 'centre' },
      { name: 'og',       width: 1200, height: 630, position: 'centre' },
    ],
    formatOptions: { format: 'webp', options: { quality: 80 } },
    mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
  },
  admin: {
    useAsTitle: 'filename',
    group: 'Inhalte',
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'alt_text_de', type: 'text' },
    { name: 'alt_text_en', type: 'text' },
    {
      name: 'category',
      type: 'select',
      options: ['group', 'logo', 'favicon', 'og', 'misc'],
      defaultValue: 'misc',
    },
  ],
};
