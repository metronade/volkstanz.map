/**
 * SeoSettings — Singleton für SEO-Konfiguration.
 *
 * robots.txt und sitemap.xml werden aus dieser Collection dynamisch
 * generiert (siehe endpoints/robots.ts und endpoints/sitemap.ts).
 */
import { CollectionConfig } from 'payload/types';

export const SeoSettings: CollectionConfig = {
  slug: 'seo_settings',
  admin: {
    useAsTitle: 'id',
    group: 'System',
    description: 'Singleton — nur eine Zeile erlaubt (id=1).',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: () => false,
  },
  fields: [
    {
      name: 'id',
      type: 'number',
      defaultValue: 1,
      admin: { hidden: true },
    },
    {
      name: 'robots_txt',
      type: 'textarea',
      defaultValue:
        'User-agent: *\nDisallow: /admin\nDisallow: /*/admin\n\nSitemap: /sitemap.xml',
      admin: { description: 'Volltext-Inhalt der /robots.txt' },
    },
    {
      name: 'sitemap_include_all',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'default_og_image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'default_locale',
      type: 'select',
      defaultValue: 'de',
      options: ['de', 'en'],
    },
    { name: 'site_title_de', type: 'text', defaultValue: 'Volkstanz-Karte' },
    { name: 'site_title_en', type: 'text', defaultValue: 'Folk Dance Map' },
    { name: 'site_description_de', type: 'textarea' },
    { name: 'site_description_en', type: 'textarea' },
  ],
};
