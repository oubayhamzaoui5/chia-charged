import { randomBytes } from 'node:crypto'

// Standalone page: no analytics, external resources, or token in query/server logs.
export async function GET() {
  const nonce = randomBytes(24).toString('base64')
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Open your order — Chia Charged</title><body><main><h1>Your Chia Charged order</h1><p>Open your order securely using the link from your receipt.</p><button id="open" type="button">View my order</button><p id="status" role="status"></p></main><script nonce="${nonce}">
  const values = new URLSearchParams(location.hash.slice(1));
  const id = values.get('id'), token = values.get('token');
  history.replaceState(null, '', location.pathname);
  const button = document.getElementById('open'), status = document.getElementById('status');
  if (!id || !token) { button.disabled = true; status.textContent = 'Link missing. Open the full link from your email.'; }
  button.onclick = async () => {
    button.disabled = true; status.textContent = 'Opening your order…';
    try {
      const response = await fetch('/api/shop/order-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to open order.');
      location.replace(result.url);
    } catch (error) { status.textContent = error.message || 'Please try again.'; button.disabled = false; }
  };
  </script></body></html>`, { headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`,
  } })
}
