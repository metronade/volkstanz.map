/**
 * AuditLogs — Revisionssicheres Audit-Trail.
 *
 * Wird automatisch durch den `auditChange`-Hook bei jeder Mutation an
 * Groups/Content/SeoSettings geschrieben. Public-Submissions schreiben
 * beim submit-Endpoint manuell.
 */
import { CollectionConfig } from 'payload/types';

export const AuditLogs: CollectionConfig = {
  slug: 'audit_logs',
  admin: {
    useAsTitle: 'action',
    group: 'System',
    defaultColumns: ['ts', 'actorType', 'action', 'entityType', 'ipPrefix'],
    disableCreate: true,
    disableDuplicate: true,
    hidden: ({ user }) => !user || (user.role !== 'superadmin' && user.role !== 'admin'),
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => true,           // intern via Hook/Endpoint
    update: () => false,
    delete: ({ req: { user } }) => user?.role === 'superadmin',
  },
  fields: [
    { name: 'ts', type: 'date', required: true, defaultValue: () => new Date() },
    {
      name: 'actorType',
      type: 'select',
      required: true,
      options: ['system', 'admin', 'submitter', 'public'],
    },
    { name: 'actor_id', type: 'text' },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        'login_ok', 'login_fail', 'login_locked',
        'create', 'update', 'delete',
        'publish', 'reject', 'consent_given', 'export',
      ],
    },
    { name: 'entityType', type: 'text' },
    { name: 'entityId', type: 'text' },
    { name: 'ipHash', type: 'text' },
    { name: 'ipPrefix', type: 'text' },
    { name: 'uaHash', type: 'text' },
    { name: 'consentVersionId', type: 'text' },
    { name: 'diff', type: 'json' },
    { name: 'reason', type: 'textarea' },
  ],
};
