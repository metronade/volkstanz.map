import de from './de.json';
import en from './en.json';

export type Locale = 'de' | 'en';
export const DEFAULT_LOCALE: Locale = 'de';
export const LOCALES: Locale[] = ['de', 'en'];

const dictionaries: Record<Locale, Record<string, string>> = {
  de,
  en,
};

/**
 * Übersetzt einen Schlüssel in die gewünschte Sprache.
 * Fehlt der Schlüssel in der Zielsprache, fällt er auf Deutsch zurück.
 *
 *   t('home.stats.groups', 'de')                  // "Gruppen"
 *   t('search.results.found', 'en', { count: 5 }) // "5 groups found"
 */
export function t(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  let value = dict[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
    }
  }
  return value;
}

/** Erkennt die Sprache aus einem URL-Pfad (z.B. "/en/…" → "en"). */
export function localeFromPath(pathname: string): Locale {
  const m = pathname.match(/^\/(en|de)(\/|$)/);
  return (m?.[1] as Locale) ?? DEFAULT_LOCALE;
}

/** Erzeugt einen lokalisierten Pfad – Deutsch ohne Prefix, Englisch mit "/en". */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  if (locale === DEFAULT_LOCALE) return `/${clean}`;
  return `/${locale}/${clean}`;
}
