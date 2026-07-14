# Plan: Agregar recursos con login (Opción A + Opción 2)

**Contexto elegido:**
- **Opción A** — Guardar recursos como PR en git (fuente de verdad se mantiene en el repo).
- **Opción 2** — Autenticación con GitHub OAuth, restringida a miembros de la organización `metropolitanomodatima`.

---

## 1) OAuth GitHub + gate de organización

- **Registrar OAuth App** en `github.com/settings/developers` (manual, lo hace el usuario — no automatizable).
  - Callback URL: `https://<dominio-vercel>/api/auth/callback`
  - Scopes: `read:org` (para verificar membresía) + `public_repo` (para abrir PRs).
- **Variables de entorno en Vercel**:
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (de la OAuth App)
  - `GITHUB_ORG` = `metropolitanomodatima`
  - `GITHUB_REPO` = `centro-conocimiento`
  - `SESSION_SECRET` (random 32 bytes, para firmar cookie de sesión)
- **Funciones serverless** en `sitio/api/`:
  - `auth/login.ts` → redirige a GitHub OAuth
  - `auth/callback.ts` → intercambia `code` por token, verifica que el usuario pertenece a `GITHUB_ORG`, guarda sesión firmada en cookie HTTP-only
  - `auth/logout.ts` → borra cookie
  - `auth/me.ts` → devuelve `{login, avatar}` si hay sesión válida, 401 si no
- **Sin dependencias pesadas**: firma de sesión con `crypto` nativo (HMAC-SHA256), sin `next-auth` ni similares. Vercel Functions puros.

---

## 2) Formulario de nuevo recurso

- **Ruta**: `/nuevo` (protegida — si no hay sesión, muestra botón "Iniciar sesión con GitHub").
- **Selector de tipo**: dropdown con las 11 categorías (`argumentario`, `concepto`, `campaña`, etc.).
- **Campos dinámicos por tipo**: parseados desde `plantillas/*.md` en build time (convertirlos a JSON estático `sitio/public/plantillas.json` con un pequeño script paralelo a `generar-indice.mjs`).
  - Cada campo del frontmatter YAML → un input del formulario
  - Detección automática de tipo (string, list, date, boolean por convención)
  - Marca campos "requeridos" según los que están en el `argumentario.md`, `caso.md`, etc.
- **Cuerpo Markdown**: textarea grande con los `## Encabezados` de la plantilla precargados como esqueleto.
- **Preview** (opcional, si alcanza): panel lateral con el `.md` generado (frontmatter + cuerpo).

---

## 3) Endpoint que crea el PR

- **`api/recursos/crear.ts`**:
  - Verifica sesión (cookie firmada)
  - Valida payload (tipo válido, campos requeridos, sin path traversal en el filename)
  - Construye el `.md` (frontmatter YAML + cuerpo)
  - Usa la API de GitHub (`Octokit` o fetch directo):
    1. `GET /repos/{owner}/{repo}/git/ref/heads/main` → SHA del `main`
    2. `POST /repos/{owner}/{repo}/git/refs` → crea branch `nuevo-recurso/<slug>-<timestamp>`
    3. `PUT /repos/{owner}/{repo}/contents/recursos/<tipo>/<slug>.md` → commit del archivo
    4. `POST /repos/{owner}/{repo}/pulls` → abre el PR con título y descripción autogenerados
  - Devuelve `{ pr_url }` para redirigir al usuario
- **Token de GitHub**: fine-grained PAT en `GITHUB_TOKEN` con permisos "Contents: write", "Pull requests: write" **solo sobre este repo**. Más seguro que el token OAuth del usuario porque no depende de sus permisos individuales, y el PR queda con "created by <bot>", con el usuario mencionado en la descripción.
  - **Alternativa**: usar el token OAuth del usuario para atribuir el PR a su cuenta directamente. Más limpio pero requiere que cada usuario tenga permisos write en el repo. **Recomendación**: token del bot con mención al usuario — separa "quién autoriza" de "quién ejecuta".

---

## 4) Integración en el sitio

- **Nuevo enlace en el `Menu.tsx`**: "Agregar recurso" (solo visible si hay sesión — llamando a `/api/auth/me` en un hook).
- **Nuevo componente `<UsuarioMenu />`**: avatar + logout arriba a la derecha cuando hay sesión.

---

## 5) Testing local

- Vercel Functions corren con `vercel dev` (no con `vite`). Documentar en el README cómo levantar auth en local.
- Para OAuth en local hace falta una segunda OAuth App con callback `http://localhost:3000/...`.

---

## Alcance y no-alcance

**Sí incluido:**
- OAuth completo con verificación de org
- Formulario dinámico por tipo con validación básica
- Creación de PR con archivo Markdown correcto
- UI para login/logout
- Manejo de errores (usuario no autorizado, token expirado, archivo duplicado, etc.)

**Fuera de alcance (agregar más adelante si se quiere):**
- Editar recursos existentes (solo creación por ahora)
- Subir adjuntos/imágenes (solo texto)
- Preview en vivo del render final
- Guardado de borradores
- Notificaciones a mantenedores por email/Slack cuando llega un PR (GitHub ya notifica)

---

## Decisiones pendientes antes de empezar

1. **Token de creación de PR**: ¿bot con PAT (recomendado) o token OAuth de cada usuario?
2. **Nombre del branch**: ¿`nuevo-recurso/<tipo>-<slug>` o `submissions/<user>-<slug>`?
3. **¿Autorizamos "colaboradores externos"** (fork + PR) o **solo miembros de la org** de MODATIMA? Con "solo miembros" el flujo es más simple.
4. **Ruta**: ¿`/nuevo`, `/agregar`, o `/contribuir`?

---

## Estimado inicial

- ~4-6 archivos nuevos en `sitio/api/` (endpoints serverless)
- ~2-3 archivos nuevos en `sitio/src/pages/` y `sitio/src/components/` (formulario, UsuarioMenu, hook de sesión)
- Script `scripts/generar-plantillas.mjs` para parsear `plantillas/*.md` → `sitio/public/plantillas.json`
- Ediciones a `Menu.tsx`, `App.tsx`, `package.json` (agregar `@octokit/rest` o dejarlo con fetch nativo)
- Actualización del `README.md` con instrucciones de env vars y `vercel dev`
