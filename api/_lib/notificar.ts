export async function notificarSolicitudAcceso(login: string, nombre: string | null, avatarUrl: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.warn('[notificar] RESEND_API_KEY o ADMIN_EMAIL no configurados — omitiendo notificación');
    return false;
  }

  const fecha = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
  const orgUrl = `https://github.com/orgs/MODATIMA/people`;

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#005B73">Solicitud de acceso — Biblioteca de Saberes</h2>
      <p>Un usuario intentó iniciar sesión pero no pertenece a la organización MODATIMA.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr>
          <td style="padding:8px;border:1px solid #D8D9CE;color:#5E6157;width:120px">Usuario</td>
          <td style="padding:8px;border:1px solid #D8D9CE">
            <a href="https://github.com/${login}" style="color:#005B73">@${login}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #D8D9CE;color:#5E6157">Nombre</td>
          <td style="padding:8px;border:1px solid #D8D9CE">${nombre ?? '—'}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #D8D9CE;color:#5E6157">Fecha</td>
          <td style="padding:8px;border:1px solid #D8D9CE">${fecha}</td>
        </tr>
      </table>
      <img src="${avatarUrl}" alt="${login}" width="48" height="48" style="border-radius:50%;margin-bottom:16px" />
      <p>Si deseas darle acceso, invítalo desde la
        <a href="${orgUrl}" style="color:#005B73">configuración de la organización</a>.
      </p>
    </div>
  `.trim();

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Biblioteca de Saberes <noreply@resend.dev>',
      to: [adminEmail],
      subject: `[Acceso] Solicitud de @${login} — MODATIMA`,
      html,
    }),
  });

  console.log(`[notificar] Resend → ${r.status}`);
  return r.status === 200 || r.status === 201;
}