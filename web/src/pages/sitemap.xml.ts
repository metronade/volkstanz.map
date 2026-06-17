/**
 * GET /sitemap.xml — Proxy an Payload /api/sitemap
 */
import type { APIRoute } from 'astro';
import { payloadBase } from '@lib/payload';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(`${payloadBase()}/api/sitemap`);
    if (res.ok) {
      return new Response(await res.text(), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=600',
        },
      });
    }
  } catch { /* fallback */ }

  return new Response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
    status: 502,
    headers: { 'Content-Type': 'application/xml' },
  });
};
