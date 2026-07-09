#!/usr/bin/env node
// Recorre /plantillas/*.md y emite sitio/public/plantillas.json
// con campos del frontmatter y esqueleto de secciones para el formulario.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

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
  matter = createRequire(pathToFileURL(sitioPkg))('gray-matter');
}

const aquí = path.dirname(fileURLToPath(import.meta.url));
const raízRepo = path.resolve(aquí, '..');
const dirPlantillas = path.join(raízRepo, 'plantillas');
const rutaSalida = path.join(raízRepo, 'sitio', 'public', 'plantillas.json');

function inferirTipoCampo(nombre, valor) {
  if (nombre.includes('fecha') || nombre.includes('date')) return 'fecha';
  if (typeof valor === 'boolean') return 'booleano';
  if (Array.isArray(valor)) return 'lista';
  if (typeof valor === 'string' && valor.includes('\n')) return 'textarea';
  return 'string';
}

const CAMPOS_REQUERIDOS = new Set(['id', 'titulo', 'tipo', 'resumen']);

async function procesarPlantilla(rutaAbs, tipo) {
  const raw = await readFile(rutaAbs, 'utf8');

  // Las plantillas tienen el YAML dentro de un bloque ```yaml ... ```
  const matchBloque = raw.match(/```yaml\s*([\s\S]*?)```/);
  let campos = [];
  if (matchBloque) {
    const parsed = matter(`---\n${matchBloque[1]}\n---`);
    campos = Object.entries(parsed.data).map(([nombre, valor]) => ({
      nombre,
      tipo: inferirTipoCampo(nombre, valor),
      requerido: CAMPOS_REQUERIDOS.has(nombre),
      valorDefecto: valor ?? '',
    }));
  }

  // Extraer encabezados ## del cuerpo (fuera del bloque yaml)
  const cuerpoSinBloque = raw.replace(/```yaml[\s\S]*?```/, '').replace(/^#[^#].*\n?/gm, '');
  const secciones = [];
  for (const line of cuerpoSinBloque.split('\n')) {
    if (line.startsWith('## ')) secciones.push(line.trim());
  }
  const esqueletoMarkdown = secciones.map((s) => `${s}\n`).join('\n');

  return { campos, esqueletoMarkdown };
}

async function main() {
  console.log('→ Generando plantillas.json…');
  const archivos = (await readdir(dirPlantillas)).filter((f) => f.endsWith('.md'));
  const resultado = {};
  for (const archivo of archivos) {
    const tipo = archivo.replace(/\.md$/, '');
    resultado[tipo] = await procesarPlantilla(path.join(dirPlantillas, archivo), tipo);
  }
  await writeFile(rutaSalida, JSON.stringify(resultado, null, 2), 'utf8');
  console.log(`✔ ${archivos.length} plantillas → sitio/public/plantillas.json`);
}

main().catch((err) => { console.error(err); process.exit(1); });
