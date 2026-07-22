#!/usr/bin/env node
// Recorre /recursos, extrae Frontmatter YAML y emite:
//  - sitio/public/indice-recursos.json  (índice consumido por la app)
//  - sitio/public/recursos/**/*.md      (copia estática servida en runtime)
//
// La fuente de verdad son los .md del repositorio. Este script se ejecuta
// antes de `vite dev` y `vite build` (ver sitio/package.json).

import { readdir, readFile, mkdir, writeFile, rm, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

// gray-matter se instala como dependencia de /sitio, no de /scripts.
// Resolvemos la ruta desde el package.json de /sitio para que este script
// funcione tanto si se ejecuta desde /sitio (npm run indice) como
// directamente desde la raíz del repositorio.
const require = createRequire(import.meta.url);
let matter;
try {
  matter = require('gray-matter');
} catch {
  const sitioPkg = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'sitio',
    'package.json',
  );
  const requireDesdeSitio = createRequire(pathToFileURL(sitioPkg));
  matter = requireDesdeSitio('gray-matter');
}

const aquí = path.dirname(fileURLToPath(import.meta.url));
const raízRepo = path.resolve(aquí, '..');
const dirRecursos = path.join(raízRepo, 'recursos');
const dirSitioPublico = path.join(raízRepo, 'sitio', 'public');
const dirRecursosPublicos = path.join(dirSitioPublico, 'recursos');
const rutaIndice = path.join(dirSitioPublico, 'indice-recursos.json');

const tiposConocidos = new Set([
  'argumentario',
  'concepto',
  'campaña',
  'campana',
  'territorio',
  'cuenca',
  'ley',
  'conflicto',
  'persona',
  'organizacion',
  'organización',
  'evento',
  'biblioteca',
]);

async function* caminarMarkdown(dir) {
  let entradas;
  try {
    entradas = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const entrada of entradas) {
    const rutaCompleta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      yield* caminarMarkdown(rutaCompleta);
    } else if (entrada.isFile() && entrada.name.toLowerCase().endsWith('.md')) {
      yield rutaCompleta;
    }
  }
}

function normalizarLista(valor) {
  if (valor == null) return [];
  if (Array.isArray(valor)) {
    return valor
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]))
      .map((v) => (typeof v === 'string' ? v.trim() : String(v)))
      .filter((v) => v.length > 0);
  }
  if (typeof valor === 'string') {
    return valor
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return [String(valor)];
}

function derivarTipoDesdeRuta(rutaRelativa) {
  const partes = rutaRelativa.split(path.sep);
  const subcarpeta = partes[0];
  if (!subcarpeta) return undefined;
  const mapa = {
    argumentarios: 'argumentario',
    conceptos: 'concepto',
    campañas: 'campaña',
    campanas: 'campaña',
    territorios: 'territorio',
    cuencas: 'cuenca',
    leyes: 'ley',
    conflictos: 'conflicto',
    personas: 'persona',
    organizaciones: 'organizacion',
    eventos: 'evento',
    biblioteca: 'biblioteca',
  };
  return mapa[subcarpeta];
}

function derivarIdDesdeRuta(rutaRelativa) {
  return rutaRelativa
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .replace(/^\/+/, '');
}

function aStringFecha(v) {
  if (!v) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  return String(v).trim() || null;
}

function extraerFecha(datos) {
  return (
    aStringFecha(datos.ultima_actualizacion) ||
    aStringFecha(datos.fecha_actualizacion) ||
    aStringFecha(datos.fecha_publicacion) ||
    aStringFecha(datos.fecha_creacion) ||
    null
  );
}

function normalizarTexto(v) {
  if (v == null) return '';
  return String(v).trim();
}

async function limpiarSalida() {
  if (existsSync(dirRecursosPublicos)) {
    await rm(dirRecursosPublicos, { recursive: true, force: true });
  }
  await mkdir(dirRecursosPublicos, { recursive: true });
}

async function copiarRecurso(rutaOrigen, rutaRelativa) {
  const rutaDestino = path.join(dirRecursosPublicos, rutaRelativa);
  await mkdir(path.dirname(rutaDestino), { recursive: true });
  await copyFile(rutaOrigen, rutaDestino);
}

async function main() {
  console.log('→ Generando índice de recursos…');

  if (!existsSync(dirRecursos)) {
    console.error(`No se encontró la carpeta ${dirRecursos}`);
    process.exit(1);
  }

  await limpiarSalida();

  const entradas = [];
  const advertencias = [];

  for await (const rutaAbs of caminarMarkdown(dirRecursos)) {
    const rutaRelativa = path.relative(dirRecursos, rutaAbs);
    const contenidoBruto = await readFile(rutaAbs, 'utf8');
    let parsed;
    try {
      parsed = matter(contenidoBruto);
    } catch (err) {
      advertencias.push(`Frontmatter inválido en ${rutaRelativa}: ${err.message}`);
      continue;
    }
    const datos = parsed.data ?? {};

    const tipo = normalizarTexto(datos.tipo) || derivarTipoDesdeRuta(rutaRelativa);
    if (!tipo || !tiposConocidos.has(tipo)) {
      advertencias.push(
        `Tipo desconocido en ${rutaRelativa} (tipo="${tipo ?? '—'}"). Se omite del índice.`,
      );
      continue;
    }

    const id = normalizarTexto(datos.id) || derivarIdDesdeRuta(rutaRelativa);
    const titulo = normalizarTexto(datos.titulo) || id;
    const resumen = normalizarTexto(datos.resumen || datos.descripcion);

    const temas = normalizarLista(datos.temas ?? datos.tema);
    const territorios = normalizarLista(datos.territorios ?? datos.territorio);
    const etiquetas = normalizarLista(datos.etiquetas);
    const relacionados = normalizarLista(datos.relacionados);

    const contenidoTexto = parsed.content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[#>*_`~\[\]()!-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const info = await stat(rutaAbs);

    entradas.push({
      id,
      tipo,
      titulo,
      resumen,
      temas,
      territorios,
      etiquetas,
      relacionados,
      fuentes: normalizarLista(datos.fuentes),
      adjuntos: normalizarLista(datos.adjuntos),
      actores: normalizarLista(datos.actores),
      nivel: normalizarTexto(datos.nivel) || null,
      publico: normalizarLista(datos.publico),
      licencia: normalizarTexto(datos.licencia) || null,
      enlace: normalizarTexto(datos.enlace || datos.url || datos.sitio_web) || null,
      region: normalizarTexto(datos.region) || null,
      fecha_inicio: aStringFecha(datos.fecha_inicio) || null,
      fecha_fin: aStringFecha(datos.fecha_fin) || null,
      hora_inicio: normalizarTexto(datos.hora_inicio ?? datos.hora) || null,
      hora_fin: normalizarTexto(datos.hora_fin) || null,
      ubicacion: normalizarTexto(datos.ubicacion) || null,
      contenidoResumen: contenidoTexto.slice(0, 1200),
      ruta: rutaRelativa.replace(/\\/g, '/'),
    });

    await copiarRecurso(rutaAbs, rutaRelativa);
  }

  entradas.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

  const porTipo = entradas.reduce((acc, r) => {
    acc[r.tipo] = (acc[r.tipo] ?? 0) + 1;
    return acc;
  }, {});

  const indice = {
    generado_en: new Date().toISOString(),
    total: entradas.length,
    por_tipo: porTipo,
    recursos: entradas,
  };

  await writeFile(rutaIndice, JSON.stringify(indice, null, 2), 'utf8');

  console.log(`✔ ${entradas.length} recursos indexados → ${path.relative(raízRepo, rutaIndice)}`);
  if (advertencias.length > 0) {
    console.log(`\n⚠ ${advertencias.length} advertencia(s):`);
    advertencias.forEach((a) => console.log('  · ' + a));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
