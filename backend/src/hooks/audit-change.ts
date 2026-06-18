/**
 * audit-change Hook — schreibt nach jeder Mutation (create/update/delete)
 * automatisch einen Audit-Log-Eintrag.
 *
 * IP wird anonymisiert als SHA-256-Hash + Prefix gespeichert.
 * User-Agent ebenfalls gehasht.
 */
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';
import { sha256, ipPrefix, getIpFromRequest, getUaFromRequest } from './anonymize-ip';

function mapAction(op: 'create' | 'update' | 'delete' | string | undefined,
                   doc: any): string {
  if (doc?.status === 'published' && op === 'update') return 'publish';
  if (doc?.status === 'rejected' && op === 'update') return 'reject';
  if (op === 'create') return 'create';
  if (op === 'delete') return 'delete';
  return op || 'update';
}

async function writeAudit(
  req: any,
  entityType: string,
  operation: string,
  doc: any,
  originalDoc?: any,
): Promise<void> {
  if (!req?.payload) return;

  const ip = getIpFromRequest(req);
  const ua = getUaFromRequest(req);

  await req.payload.create({
    collection: 'audit_logs',
    overrideAccess: true,
    data: {
      ts: new Date().toISOString(),
      actorType: req.user ? 'admin' : 'system',
      actor_id: req.user?.id ? String(req.user.id) : undefined,
      action: mapAction(operation, doc),
      entityType,
      entityId: doc?.id != null ? String(doc.id) : undefined,
      ipHash: ip ? sha256(ip) : undefined,
      ipPrefix: ipPrefix(ip),
      uaHash: ua ? sha256(ua) : undefined,
      diff: { before: originalDoc ?? null, after: doc ?? null },
      reason: doc?.rejection_reason || undefined,
    },
  });
}

export const auditChange =
  (entityType: string): CollectionAfterChangeHook =>
  async ({ req, operation, doc, previousDoc }) => {
    try {
      await writeAudit(req, entityType, operation, doc, previousDoc);
    } catch (err) {
      req.payload.logger.error('[audit-change] failed:', err);
    }
    return doc;
  };

export const auditDelete =
  (entityType: string): CollectionAfterDeleteHook =>
  async ({ req, doc }) => {
    try {
      await writeAudit(req, entityType, 'delete', doc);
    } catch (err) {
      req.payload.logger.error('[audit-delete] failed:', err);
    }
    return doc;
  };
