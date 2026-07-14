import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[auth/login] handler invocado');
  const clientId = process.env.GITHUB_CLIENT_ID;
  console.log('[auth/login] GITHUB_CLIENT_ID:', clientId ? '✓ presente' : '✗ FALTA');
  console.log('[auth/login] SITE_URL:', process.env.SITE_URL ?? '(vacío)');

  if (!clientId) return res.status(500).json({ error: 'GITHUB_CLIENT_ID no configurado' });

  const redirectUri = `${process.env.SITE_URL ?? ''}/api/auth/callback`;
  console.log('[auth/login] redirect_uri:', redirectUri);

  const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : '/';
  const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'read:user read:org',
    redirect_uri: redirectUri,
    state,
  });

  const url = `https://github.com/login/oauth/authorize?${params}`;
  console.log('[auth/login] redirigiendo a:', url);
  res.redirect(302, url);
}
