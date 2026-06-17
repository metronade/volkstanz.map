/**
 * audit-change Hook — schreibt nach jeder Mutation (create/update/delete)
 * automatisch einen Audit-Log-Eintrag.
 *
 * IP wird anonymisiert als SHA-256-Hash + Prefix gespeichert.
 * User-Agent ebenfalls gehasht.
 */
import { FieldHook } from 'payload/types';
import { createHash } from 'node:crypto';

function sha256(input: string): string {
  const salt = new Date().toISOString().slice(0, 10); // täglich wechselnd
  return createHash('sha256').update(input + ':' + salt).digest('hex');
}

function ipPrefix(ip: string): string {
  if (!ip) return 'unknown';
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::/48';
  }
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts.slice(0, 3).join('.')}.x/24`;
  return 'unknown';
}

export const auditChange =
  (entityType: string): FieldHook =>
  async ({ req, operation, data, originalDoc, result }) => {
    const doc = result || data || originalDoc;
    const id = doc?.id;

    const ip = req.headers.get('x-forwarded-for') || req.socket?.remoteAddress || '';
    const ua = req.headers.get('user-agent') || '';

    await req.payload.create({
      collection: 'audit_logs',
      data: {
        ts: new Date().toISOString(),
        actorType: req.user ? 'admin' : 'system',
        actor_id: req.user?.id ? String(req.user.id) : undefined,
        action: mapOperation(operation),
        entityType,
        entityId: id ? String(id) : undefined,
        ipHash: ip ? sha256(ip) : undefined,
        ipPrefix: ipPrefix(ip),
        uaHash: ua ? sha256(ua) : undefined,
        diff: { before: originalDoc ?? null, after: doc ?? null },
        reason: doc?.rejection_reason || undefined,
      },
      overrideAccess: true,
    });
    return doc;
  };

function mapOperation(op: string | undefined): string {
  switch (op) {
    case 'create': return 'create';
    case 'update': return 'update';
    case 'delete': return 'delete';
    default: return op || 'update';
  }
}
