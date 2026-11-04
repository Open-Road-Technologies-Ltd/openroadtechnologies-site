// Cloudflare Pages executes this before static files. The public company site
// stays public; the app and everything beneath it require the shared password.
export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  if (path !== '/app' && !path.startsWith('/app/')) return context.next();

  const secret = context.env.APP_SITE_PASSWORD;
  const noStore = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };
  if (typeof secret !== 'string' || !secret) {
    return new Response('This page is temporarily unavailable.', { status: 503, headers: noStore });
  }

  const challenge = () => new Response('Authentication required.', {
    status: 401,
    headers: { ...noStore, 'WWW-Authenticate': 'Basic realm="Open Road app", charset="UTF-8"' },
  });
  const header = context.request.headers.get('Authorization') || '';
  const match = /^Basic\s+([A-Za-z0-9+/]+={0,2})$/i.exec(header);
  if (!match) return challenge();
  let credentials;
  try {
    const bytes = Uint8Array.from(atob(match[1]), character => character.charCodeAt(0));
    credentials = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch { return challenge(); }
  const separator = credentials.indexOf(':');
  if (separator < 0 || credentials.slice(0, separator) !== 'openroad') return challenge();

  const encoder = new TextEncoder();
  const [actual, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(credentials.slice(separator + 1))),
    crypto.subtle.digest('SHA-256', encoder.encode(secret)),
  ]);
  const a = new Uint8Array(actual), b = new Uint8Array(expected);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  if (mismatch) return challenge();

  const upstream = await context.next();
  const response = new Response(upstream.body, upstream);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
