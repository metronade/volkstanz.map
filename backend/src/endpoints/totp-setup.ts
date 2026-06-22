/**
 * TOTP-Auth-Strategie für Payload.
 *
 * Override des Login-Flows: Statt nur Passwort-Check wird ein zweiter
 * Schritt mit TOTP-Code verlangt. Implementiert via otplib.
 *
 * Endpoints (alle unter /api/):
 *   POST /totp/setup      — generiert Secret, gibt QR-URL zurück (auth requ.)
 *   POST /totp/verify     — verifiziert Code, aktiviert TOTP für User
 *   POST /totp/disable    — deaktiviert TOTP
 */
import type { Endpoint } from 'payload';
import { authenticator } from 'otplib';

export const totpSetupEndpoint: Endpoint = {
  path: '/totp/setup',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(
      req.user.email,
      process.env.TOTP_ISSUER || 'Volkstanz·Map',
      secret,
    );
    await req.payload.update({
      collection: 'users',
      id: req.user.id,
      data: { totp_secret: secret, totp_enabled: false },
      overrideAccess: true,
    });
    return Response.json({ secret, otpauth });
  },
};

export const totpVerifyEndpoint: Endpoint = {
  path: '/totp/verify',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const { token } = (await req.json()) as { token: string };
    const user = await req.payload.findByID({
      collection: 'users',
      id: req.user.id,
      overrideAccess: true,
    });
    if (!user?.totp_secret) {
      return Response.json({ error: 'totp_not_setup' }, { status: 400 });
    }
    if (!authenticator.verify({ token, secret: user.totp_secret })) {
      return Response.json({ error: 'invalid_token' }, { status: 401 });
    }
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { totp_enabled: true },
      overrideAccess: true,
    });
    return Response.json({ totp_enabled: true });
  },
};

export const totpDisableEndpoint: Endpoint = {
  path: '/totp/disable',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const { token } = (await req.json()) as { token: string };
    const user = await req.payload.findByID({
      collection: 'users',
      id: req.user.id,
      overrideAccess: true,
    });
    if (!user?.totp_secret) {
      return Response.json({ error: 'totp_not_setup' }, { status: 400 });
    }
    if (!authenticator.verify({ token, secret: user.totp_secret })) {
      return Response.json({ error: 'invalid_token' }, { status: 401 });
    }
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { totp_secret: null, totp_enabled: false },
      overrideAccess: true,
    });
    return Response.json({ totp_enabled: false });
  },
};

/** Exportiere die TOTP-Helper für die Auth-Strategie in payload.config.ts. */
export { authenticator };
