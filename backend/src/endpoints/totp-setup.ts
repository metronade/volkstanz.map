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
 *   POST /totp/login-step2 — nimmt Email/Pwd/TOTP-Token entgegen
 */
import { Endpoint } from 'payload';
import { authenticator } from 'otplib';
import { PayloadRequest } from 'payload';

function requireUser(req: PayloadRequest): boolean {
  return Boolean(req.user);
}

export const totpSetupEndpoint: Endpoint = {
  path: '/totp/setup',
  method: 'post',
  handler: async (req, res) => {
    if (!requireUser(req)) return res.status(401).json({ error: 'unauthorized' });
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(
      req.user.email,
      process.env.TOTP_ISSUER || 'Volkstanz·Map',
      secret,
    );
    // Secret temporär im User-Dokument ablegen (noch nicht aktiviert)
    await req.payload.update({
      collection: 'users',
      id: req.user.id,
      data: { totp_secret: secret, totp_enabled: false },
      overrideAccess: true,
    });
    res.status(200).json({ secret, otpauth });
  },
};

export const totpVerifyEndpoint: Endpoint = {
  path: '/totp/verify',
  method: 'post',
  handler: async (req, res) => {
    if (!requireUser(req)) return res.status(401).json({ error: 'unauthorized' });
    const { token } = req.body as { token: string };
    const user = await req.payload.findByID({
      collection: 'users',
      id: req.user.id,
      overrideAccess: true,
    });
    if (!user?.totp_secret) {
      return res.status(400).json({ error: 'totp_not_setup' });
    }
    if (!authenticator.verify({ token, secret: user.totp_secret })) {
      return res.status(401).json({ error: 'invalid_token' });
    }
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { totp_enabled: true },
      overrideAccess: true,
    });
    res.status(200).json({ totp_enabled: true });
  },
};

export const totpDisableEndpoint: Endpoint = {
  path: '/totp/disable',
  method: 'post',
  handler: async (req, res) => {
    if (!requireUser(req)) return res.status(401).json({ error: 'unauthorized' });
    const { token } = req.body as { token: string };
    const user = await req.payload.findByID({
      collection: 'users',
      id: req.user.id,
      overrideAccess: true,
    });
    if (!user?.totp_secret) {
      return res.status(400).json({ error: 'totp_not_setup' });
    }
    if (!authenticator.verify({ token, secret: user.totp_secret })) {
      return res.status(401).json({ error: 'invalid_token' });
    }
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { totp_secret: null, totp_enabled: false },
      overrideAccess: true,
    });
    res.status(200).json({ totp_enabled: false });
  },
};

/** Exportiere die TOTP-Helper für die Auth-Strategie in payload.config.ts. */
export { authenticator };
