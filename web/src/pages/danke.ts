/**
 * GET /danke
 *
 * Schlanke Bestätigungsseite nach erfolgreicher Submission.
 * Wird serverseitig gerendert, damit Redirect von /api/submit sauber funktioniert.
 */
import type { APIRoute } from 'astro';
import Base from '@layouts/Base.astro';
import { t, localeFromPath } from '@i18n/index';

export const prerender = false;

export const GET: APIRoute = async () => {
  const locale = localeFromPath('/'); // immer 'de', da /danke ohne locale-Prefix
  const html = `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <title>${t('submit.success.title', locale)} · Volkstanz·Map</title>
  <link rel="icon" href="/favicon.svg">
  <style>
    body { font-family: 'Cormorant Garamond', Georgia, serif; background: #F5EFE3; color: #2B2724; padding: 4rem 1.5rem; text-align: center; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    p { font-family: 'Inter', sans-serif; line-height: 1.6; max-width: 480px; margin: 0 auto 2rem; color: #5C544A; }
    a { color: #3D5641; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${t('submit.success.title', locale)}</h1>
  <p>${t('submit.success.body', locale)}</p>
  <p><a href="/">← zur Karte</a></p>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
