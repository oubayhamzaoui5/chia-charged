export function authCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, maxAge, path: '/' }
}
