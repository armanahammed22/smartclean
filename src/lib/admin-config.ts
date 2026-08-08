/**
 * Centralized Admin Configuration
 * Stores UIDs and emails for bootstrap administrative access.
 */

export const BOOTSTRAP_ADMIN_UIDS = [
  'Q8QpZP1GzzWf2f2K6WTe476PcD92',
  'uZAUBd4L5veqdxk4H6QvKz4Ddgf2'
];

export const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

/**
 * Helper to check if a user object matches admin criteria
 */
export function isUserAdmin(user: any, adminRoleDoc?: any) {
  if (!user) return false;
  
  const email = user.email?.toLowerCase();
  const uid = user.uid;

  return (
    uid === 'Q8QpZP1GzzWf2f2K6WTe476PcD92' ||
    uid === 'uZAUBd4L5veqdxk4H6QvKz4Ddgf2' ||
    email === BOOTSTRAP_ADMIN_EMAIL ||
    !!adminRoleDoc
  );
}
