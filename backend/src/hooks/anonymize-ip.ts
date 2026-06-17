/**
 * anonymize-ip — Hilfsfunktion für Custom-Endpoints.
 * Gibt Hash + Prefix zurück.
 */
import { createHash } from 'node:crypto';

export function sha256(input: string): string {
  const salt = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(input + ':' + salt).digest('hex');
}

export function ipPrefix(ip: string): string {
  if (!ip) return 'unknown';
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::/48';
  }
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts.slice(0, 3).join('.')}.x/24`;
  return 'unknown';
}

export function getIpFromRequest(req: any): string {
  return (
    req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req?.headers?.['x-real-ip'] ||
    req?.socket?.remoteAddress ||
    ''
  );
}

export function getUaFromRequest(req: any): string {
  return req?.headers?.['user-agent'] || '';
}
