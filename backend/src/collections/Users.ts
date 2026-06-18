/**
 * Users — Admin-User des CMS.
 *
 * Rollen: superadmin | admin | moderator | translator
 * TOTP: Secret wird verschlüsselt in `totp_secret` gespeichert,
 *       aktiviert via `totp_enabled`.
 */
import { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Wir überschreiben den Login-Endpoint später, um TOTP zu erzwingen.
    tokenExpiration: 60 * 60 * 8, // 8h idle
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    maxLoginAttempts: Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS) || 5,
    lockTime: (Number(process.env.AUTH_LOCK_TIME) || 900) * 1000,
  },
  admin: {
    useAsTitle: 'email',
    group: 'System',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => user?.role === 'superadmin',
    update: ({ req: { user }, id }) => Boolean(user) && (user.role === 'superadmin' || user.id === id),
    delete: ({ req: { user } }) => user?.role === 'superadmin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'translator',
      options: [
        { label: 'Super-Admin',    value: 'superadmin' },
        { label: 'Administrator',  value: 'admin' },
        { label: 'Moderator',      value: 'moderator' },
        { label: 'Übersetzer',     value: 'translator' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'totp_secret',
      type: 'text',
      hidden: true,
      admin: { hidden: true },
    },
    {
      name: 'totp_enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'failed_logins',
      type: 'number',
      defaultValue: 0,
      hidden: true,
    },
    {
      name: 'locked_until',
      type: 'date',
      hidden: true,
    },
    {
      name: 'last_login_at',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'last_login_ip',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
};
