const ORG = () => process.env.GITHUB_ORG ?? 'metropolitanomodatima';
const REPO = () => process.env.GITHUB_REPO ?? 'centro-conocimiento';
const BOT_TOKEN = () => {
  const t = process.env.GITHUB_BOT_TOKEN;
  if (!t) throw new Error('GITHUB_BOT_TOKEN no configurado');
  return t;
};

function ghFetch(path: string, init?: RequestInit, token?: string) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token ?? BOT_TOKEN()}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export async function esMiembroOrg(login: string, userToken: string): Promise<boolean> {
  if (login.toLowerCase() === ORG().toLowerCase()) return true;
  const r = await ghFetch(`/orgs/${ORG()}/members/${login}`, { method: 'GET' }, userToken);
  console.log(`[esMiembroOrg] GET /orgs/${ORG()}/members/${login} → ${r.status}`);
  return r.status === 204;
}


export async function shaMain(): Promise<string> {
  const r = await ghFetch(`/repos/${ORG()}/${REPO()}/git/ref/heads/main`);
  if (!r.ok) throw new Error(`No se pudo obtener SHA de main: ${r.status}`);
  const data = await r.json();
  return data.object.sha as string;
}

export async function crearRama(nombre: string, sha: string): Promise<void> {
  const r = await ghFetch(`/repos/${ORG()}/${REPO()}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${nombre}`, sha }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`No se pudo crear rama '${nombre}': ${JSON.stringify(err)}`);
  }
}

export async function subirArchivo(opts: {
  ruta: string;
  contenido: string;
  mensaje: string;
  rama: string;
  sha?: string;
}): Promise<void> {
  const body: Record<string, unknown> = {
    message: opts.mensaje,
    content: Buffer.from(opts.contenido).toString('base64'),
    branch: opts.rama,
  };
  if (opts.sha) body.sha = opts.sha;
  const r = await ghFetch(`/repos/${ORG()}/${REPO()}/contents/${opts.ruta}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`No se pudo subir archivo: ${JSON.stringify(err)}`);
  }
}

export async function abrirPR(opts: {
  titulo: string;
  cuerpo: string;
  rama: string;
}): Promise<string> {
  const r = await ghFetch(`/repos/${ORG()}/${REPO()}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title: opts.titulo, body: opts.cuerpo, head: opts.rama, base: 'main' }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`No se pudo abrir PR: ${JSON.stringify(err)}`);
  }
  const data = await r.json();
  return data.html_url as string;
}

export async function ghDelete(opts: {
  ruta: string;
  mensaje: string;
  rama: string;
  sha: string;
}): Promise<void> {
  const r = await ghFetch(`/repos/${ORG()}/${REPO()}/contents/${opts.ruta}`, {
    method: 'DELETE',
    body: JSON.stringify({ message: opts.mensaje, sha: opts.sha, branch: opts.rama }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`No se pudo eliminar archivo: ${JSON.stringify(err)}`);
  }
}

export async function shaArchivo(ruta: string): Promise<string | null> {
  const r = await ghFetch(`/repos/${ORG()}/${REPO()}/contents/${ruta}?ref=main`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Error al obtener sha del archivo: ${r.status}`);
  const data = await r.json();
  return data.sha as string;
}
