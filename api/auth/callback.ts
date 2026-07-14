import type { VercelRequest, VercelResponse } from '@vercel/node';
import { crearCookie } from '../_lib/sesion.js';
import { obtenerRol } from '../_lib/roles.js';
import { esMiembroOrg } from '../_lib/github.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string | undefined;
  if (!code) return res.status(400).json({ error: 'Falta el código de autorización' });

  let returnTo = '/';
  try {
    const raw = Buffer.from(req.query.state as string, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as { returnTo?: string };
    if (parsed.returnTo?.startsWith('/')) returnTo = parsed.returnTo;
  } catch {
    // state inválido o ausente → volver al inicio
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'OAuth App no configurada en el servidor' });
  }

  // Intercambiar code por access_token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return res.status(401).json({ error: tokenData.error ?? 'No se pudo obtener el token' });
  }
  const userToken = tokenData.access_token;

  // Obtener perfil del usuario
  const userRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${userToken}`, 'Accept': 'application/vnd.github+json' },
  });
  if (!userRes.ok) return res.status(401).json({ error: 'No se pudo obtener el perfil de GitHub' });
  const user = await userRes.json() as { login: string; name?: string; avatar_url: string };

  console.log('[callback] usuario:', user.login);

  // Verificar membresía de la org
  const esMiembro = await esMiembroOrg(user.login, userToken);
  console.log('[callback] esMiembro:', esMiembro);
  if (!esMiembro) {
    const siteUrl = process.env.SITE_URL ?? '';
    console.log('[callback] no es miembro, redirigiendo a error');
    return res.redirect(302, `${siteUrl}/?error=no-miembro`);
  }

  // Asignar rol
  const rol = await obtenerRol(user.login);
  console.log('[callback] rol asignado:', rol);

  const sesion = {
    login: user.login,
    nombre: user.name ?? null,
    avatarUrl: user.avatar_url,
    rol,
  };

  const cookie = crearCookie(sesion);
  console.log('[callback] cookie creada, redirigiendo a:', returnTo);
  res.setHeader('Set-Cookie', cookie);
  res.redirect(302, `${process.env.SITE_URL ?? ''}${returnTo}`);
}
