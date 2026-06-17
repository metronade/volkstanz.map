/**
 * GET /robots.txt
 *
 * Liest die robots.txt aus der `seo_settings`-Tabelle (Admin editierbar)
 * und liefert sie aus. Fallback falls Directus nicht erreichbar: ein
 * sicheres Standard-Set.
 */
import type { APIRoute } from 'astro';
import { directusGet } from '@lib/directus';

export const prerender = false;

const FALLBACK = `User-agent: *
Disallow: /admin
Disallow: /*/admin

Sitemap: /sitemap.xml
`;

export const GET: APIRoute = async () => {
  const data = await directusGet<{ data: { robots_txt: string } | null }>('/items/seo_settings', {
    single: '1',
    fields: 'robots_txt',
  });

  const robots = data?.data?.robots_txt || FALLBACK;

  return new Response(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
