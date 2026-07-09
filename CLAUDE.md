# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repositorio

Centro de Conocimiento de MODATIMA: plataforma colaborativa que documenta recursos sobre justicia socioambiental. **Los archivos Markdown en `/recursos` son la fuente de verdad**; la aplicación web (`/sitio`) es un lector estático de ese contenido, no una base de datos.

## Arquitectura

El proyecto tiene dos capas desacopladas por un artefacto de build:

1. **Contenido (`/recursos/**/*.md`)** — cada archivo tiene frontmatter YAML (`id`, `titulo`, `tipo`, `resumen`, más campos opcionales como `temas`, `territorios`, `relacionados`, `adjuntos`). Está organizado por tipo en subcarpetas (`argumentarios/`, `conceptos/`, `campañas/`, `territorios/`, `cuencas/`, `leyes/`, `casos/`, `personas/`, `organizaciones/`, `eventos/`, `biblioteca/`). Las **plantillas base** están en `/plantillas` — son la referencia canónica del frontmatter esperado por tipo.

2. **Aplicación (`/sitio`)** — Vite + React 18 + TypeScript + Tailwind + React Router + react-markdown + Fuse.js. Es puramente estática (sin backend, sin API). Consume dos artefactos generados en build:
   - `sitio/public/indice-recursos.json` — índice consolidado con metadatos de todos los recursos.
   - `sitio/public/recursos/**/*.md` — copia de los .md servidos como estáticos.

   Ambos están en `.gitignore` y se regeneran automáticamente. La app usa el índice para búsqueda/filtros/navegación y hace `fetch` del .md individual solo al abrir una ficha de recurso.

**El puente entre las dos capas es `scripts/generar-indice.mjs`** (ejecutado como `npm run indice` desde `/sitio`, o `node scripts/generar-indice.mjs` desde la raíz). Parsea frontmatter con `gray-matter`, normaliza listas (singular/plural, coma-separado, arrays), deriva el `tipo` desde la subcarpeta si no está en el frontmatter, y ordena por `fecha_actualizacion` desc. La lista de `tiposConocidos` en ese script es autoritaria — agregar un tipo nuevo requiere actualizarla ahí Y en `sitio/src/types/recurso.ts`.

`scripts/validar-recursos.mjs` valida frontmatter (correr manualmente para chequear consistencia antes de commit).

## Comandos

Todo se corre desde `/sitio` salvo que se indique lo contrario:

```bash
cd sitio
npm install              # una sola vez
npm run dev              # regenera índice + Vite en http://localhost:5173
npm run build            # regenera índice + tsc -b + vite build → sitio/dist
npm run indice           # solo regenera el índice (útil al editar recursos)
npm run lint             # eslint estricto, 0 warnings
npm run format           # prettier sobre src/**
```

Regenerar el índice desde la raíz (sin `cd sitio`):

```bash
node scripts/generar-indice.mjs
```

Validar frontmatter de todos los recursos:

```bash
node scripts/validar-recursos.mjs
```

## Convenciones de contenido

- Nombres de archivo: minúsculas, guiones, sin acentos ni espacios (`recursos/casos/nombre-del-caso.md`).
- El `id` del frontmatter sí puede usar puntos como separador semántico (`argumentario.agua.privatizacion`).
- Campos `tema`/`temas`, `territorio`/`territorios` se aceptan en singular o plural — el índice los normaliza a listas.
- Relaciones entre recursos: `relacionados:` con la lista de `id` referenciados.
- Al agregar un recurso nuevo: copiar la plantilla correspondiente desde `/plantillas`, completar frontmatter, guardar en la subcarpeta que le corresponde. El índice se regenera automáticamente en `dev`/`build`.

## Idioma

Identificadores en código y nombres de archivo están en español (`cargarIndice`, `Busqueda.tsx`, `TarjetaRecurso.tsx`). Mantener esa convención al agregar código nuevo. Alias `@/` apunta a `sitio/src/`.