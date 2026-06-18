/**
 * Access-Helper für die Groups-Collection.
 *
 * Lesen:
 *   - Status 'published' → public
 *   - Alle anderen Status → nur eingeloggte Admins/Moderatoren
 *
 * Schreiben (create/update):
 *   - Admin oder Moderator
 *   - Public-Create nur via /submit-group-Endpoint (der das Setzen von
 *     status=pending und die Consent-Referenzen erzwingt)
 */
import { Access } from 'payload';

export const isPublicRead: Access = ({ req: { user }, id, query }) => {
  // Eingeloggter User → alles sehen
  if (user) return true;

  // Anon → nur Published; query wird mit status:equals=published angereichert
  return {
    status: { equals: 'published' },
  };
};

export const isAdminOrModerator: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (user.role === 'superadmin' || user.role === 'admin' || user.role === 'moderator') {
    return true;
  }
  return false;
};

export const isAdmin: Access = ({ req: { user } }) => {
  if (!user) return false;
  return user.role === 'superadmin' || user.role === 'admin';
};
