/**
 * Allgemeine Access-Helper.
 */
import { Access } from 'payload/types';

export const isLoggedIn: Access = ({ req: { user } }) => Boolean(user);

export const isAdmin: Access = ({ req: { user } }) =>
  Boolean(user) && (user.role === 'superadmin' || user.role === 'admin');

export const isSuperadmin: Access = ({ req: { user } }) =>
  Boolean(user) && user.role === 'superadmin';

export const isAdminOrModerator: Access = ({ req: { user } }) =>
  Boolean(user) &&
  (user.role === 'superadmin' || user.role === 'admin' || user.role === 'moderator');
