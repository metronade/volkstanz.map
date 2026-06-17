/**
 * GET /robots.txt — Proxy an Payload /api/robots
 */
import type { APIRoute } from 'astro';
import { payloadBase } from '@lib/payload';

export const prerender = false;

export const GET: APIRoute = async () => {
  const fallback = `User-agent: *
Disallow: /admin
Disallow: /*/admin

Sitemap: /sitemap.xml
`;

  try {
    const res = await fetch(`${payloadBase()}/api/robots`);
    if (res.ok) {
      return new Response(await res.text(), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
  } catch { /* fallback */ }

  return new Response(fallback, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
