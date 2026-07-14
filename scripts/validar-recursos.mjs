#!/usr/bin/env node
// Valida coherencia de los recursos en /recursos:
//  - Frontmatter YAML parseable
//  - Campos obligatorios: id, titulo, tipo
//  - tipo conocido y consistente con la subcarpeta
//  - id único en todo el corpus
//  - id con prefijo del tipo (cuenca.foo, conflicto.bar, …)
//  - Referencias a otros recursos (strings con formato <tipo>.<slug>)
//    apuntan a un id existente. Los strings de texto libre se ignoran.
//
// Aplica correcciones automáticas seguras:
//  - Añade `tipo:` al frontmatter si falta y puede derivarse de la subcarpeta
//  - Añade `id:` al frontmatter si falta y puede derivarse de la ruta
//
// No aplica correcciones riesgosas (renombrar ids, sincronizar bidireccionalidad,
// eliminar referencias) — esas se reportan como errores y detienen el build.
//
// Salida:
//  - Exit 0: sin errores (avisos permitidos)
//  - Exit 1: uno o más errores encontrados
//
// Modo `--check` (por defecto en CI/build): no modifica archivos.
// Modo `--fix` (por defecto en dev): aplica correcciones seguras.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
  const requireDesdeSitio = createRequire(pathToFileURL(sitioPkg));
  matter = requireDesdeSitio('gray-matter');
}

const aquí = path.dirname(fileURLToPath(import.meta.url));
const raízRepo = path.resolve(aquí, '..');
const dirRecursos = path.join(raízRepo, 'recursos');

const args = new Set(process.argv.slice(2));
const modoFix = args.has('--fix');
const modoCheck = args.has('--check') || !modoFix;

// Tipos válidos (coinciden con generar-indice.mjs y src/types/recurso.ts).
// Nota: `campaña` es el nombre canónico del tipo pero los IDs usan prefijo
// `campana.` (sin ñ) por compatibilidad con slugs ASCII.
const TIPOS = {
  argumentario: { prefijoId: 'argumentario', carpetas: ['argumentarios'] },
  concepto: { prefijoId: 'concepto', carpetas: ['conceptos'] },
  campaña: { prefijoId: 'campana', carpetas: ['campañas', 'campanas'] },
  territorio: { prefijoId: 'territorio', carpetas: ['territorios'] },
  cuenca: { prefijoId: 'cuenca', carpetas: ['cuencas'] },
  ley: { prefijoId: 'ley', carpetas: ['leyes'] },
  conflicto: { prefijoId: 'conflicto', carpetas: ['conflictos'] },
  persona: { prefijoId: 'persona', carpetas: ['personas'] },
  organizacion: { prefijoId: 'organizacion', carpetas: ['organizaciones'] },
  evento: { prefijoId: 'evento', carpetas: ['eventos'] },
  biblioteca: { prefijoId: 'biblioteca', carpetas: ['biblioteca'] },
};

const carpetaATipo = new Map();
for (const [tipo, meta] of Object.entries(TIPOS)) {
  for (const carpeta of meta.carpetas) carpetaATipo.set(carpeta, tipo);
}

const prefijosValidos = Object.values(TIPOS).map((m) => m.prefijoId);
// Un string es una "referencia de ID" si empieza con uno de los prefijos
// conocidos seguido de un punto y un slug ASCII.
const reReferenciaId = new RegExp(
  `^(?:${prefijosValidos.join('|')})\\.[a-zA-Z0-9._-]+$`,
);

// Campos donde buscamos referencias a otros recursos. Cada valor puede ser
// un ID (validado) o texto libre (ignorado).
const CAMPOS_CON_REFERENCIAS = [
  'relacionados',
  'conflictos',
  'campañas',
  'campanas',
  'territorios',
  'cuencas',
  'organizaciones',
  'legislacion',
  'personas',
  'argumentarios',
  'conceptos',
  'biblioteca',
  'eventos',
  'comunidades',
];

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
      .map((v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()))
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
  return carpetaATipo.get(subcarpeta);
}

function derivarIdDesdeRuta(rutaRelativa, tipo) {
  const prefijo = TIPOS[tipo]?.prefijoId;
  if (!prefijo) return null;
  const base = path.basename(rutaRelativa, '.md');
  return `${prefijo}.${base}`;
}

async function cargarArchivos() {
  const archivos = [];
  const advertencias = [];
  const errores = [];

  for await (const rutaAbs of caminarMarkdown(dirRecursos)) {
    const rutaRelativa = path.relative(dirRecursos, rutaAbs);
    const rutaPosix = rutaRelativa.replace(/\\/g, '/');
    const contenidoBruto = await readFile(rutaAbs, 'utf8');
    let parsed;
    try {
      parsed = matter(contenidoBruto);
    } catch (err) {
      errores.push({
        ruta: rutaPosix,
        mensaje: `Frontmatter YAML inválido: ${err.message}`,
      });
      continue;
    }
    archivos.push({
      rutaAbs,
      rutaRelativa,
      rutaPosix,
      contenidoBruto,
      data: parsed.data ?? {},
      content: parsed.content ?? '',
    });
  }

  return { archivos, advertencias, errores };
}

function esTipoValido(tipo) {
  return typeof tipo === 'string' && Object.hasOwn(TIPOS, tipo);
}

// Inserta o reemplaza una línea "clave: valor" al inicio del frontmatter YAML.
// Preserva las demás líneas tal como estén. Devuelve el nuevo contenido o null
// si no se pudo aplicar la corrección de forma segura.
function insertarClaveEnFrontmatter(contenido, clave, valor) {
  const m = contenido.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const bloque = m[1];
  const reClave = new RegExp(`^${clave}\\s*:.*$`, 'm');
  let nuevoBloque;
  if (reClave.test(bloque)) {
    nuevoBloque = bloque.replace(reClave, `${clave}: ${valor}`);
  } else {
    // Insertar después de la primera línea (típicamente `id:` o al inicio).
    nuevoBloque = `${clave}: ${valor}\n${bloque}`;
  }
  return contenido.replace(m[0], `---\n${nuevoBloque}\n---\n`);
}

async function corregirCampoFaltante(archivo, clave, valor) {
  const nuevoContenido = insertarClaveEnFrontmatter(archivo.contenidoBruto, clave, valor);
  if (nuevoContenido == null) return false;
  if (modoFix) {
    await writeFile(archivo.rutaAbs, nuevoContenido, 'utf8');
  }
  archivo.contenidoBruto = nuevoContenido;
  archivo.data[clave] = valor;
  return true;
}

async function validar() {
  console.log('→ Validando recursos…');

  if (!existsSync(dirRecursos)) {
    console.error(`No se encontró la carpeta ${dirRecursos}`);
    process.exit(1);
  }

  const { archivos, errores, advertencias } = await cargarArchivos();

  const correccionesAplicadas = [];
  const correccionesPendientes = [];

  // Paso 1: normalizar tipo e id en cada archivo.
  for (const archivo of archivos) {
    const tipoDeclarado = typeof archivo.data.tipo === 'string' ? archivo.data.tipo.trim() : '';
    const tipoDerivado = derivarTipoDesdeRuta(archivo.rutaRelativa);

    if (!tipoDeclarado) {
      if (tipoDerivado && esTipoValido(tipoDerivado)) {
        const aplicada = await corregirCampoFaltante(archivo, 'tipo', tipoDerivado);
        (aplicada && modoFix ? correccionesAplicadas : correccionesPendientes).push(
          `${archivo.rutaPosix}: añadir 'tipo: ${tipoDerivado}'`,
        );
        if (!aplicada) {
          errores.push({
            ruta: archivo.rutaPosix,
            mensaje: `Falta 'tipo' y no fue posible autocorregir.`,
          });
        }
      } else {
        errores.push({
          ruta: archivo.rutaPosix,
          mensaje: `Falta 'tipo' y la subcarpeta no permite derivarlo.`,
        });
      }
    } else if (!esTipoValido(tipoDeclarado)) {
      errores.push({
        ruta: archivo.rutaPosix,
        mensaje: `Tipo desconocido: "${tipoDeclarado}". Válidos: ${Object.keys(TIPOS).join(', ')}.`,
      });
    } else if (tipoDerivado && tipoDerivado !== tipoDeclarado) {
      errores.push({
        ruta: archivo.rutaPosix,
        mensaje: `Tipo '${tipoDeclarado}' no coincide con la subcarpeta (debería ser '${tipoDerivado}').`,
      });
    }

    const tipoEfectivo = archivo.data.tipo;
    if (!esTipoValido(tipoEfectivo)) continue;

    const idDeclarado = typeof archivo.data.id === 'string' ? archivo.data.id.trim() : '';
    if (!idDeclarado) {
      const idDerivado = derivarIdDesdeRuta(archivo.rutaRelativa, tipoEfectivo);
      if (idDerivado) {
        const aplicada = await corregirCampoFaltante(archivo, 'id', idDerivado);
        (aplicada && modoFix ? correccionesAplicadas : correccionesPendientes).push(
          `${archivo.rutaPosix}: añadir 'id: ${idDerivado}'`,
        );
        if (!aplicada) {
          errores.push({
            ruta: archivo.rutaPosix,
            mensaje: `Falta 'id' y no fue posible autocorregir.`,
          });
        }
      } else {
        errores.push({
          ruta: archivo.rutaPosix,
          mensaje: `Falta 'id' y no puede derivarse.`,
        });
      }
    }
  }

  // Paso 2: verificar título y prefijo del id.
  const idsPorArchivo = new Map(); // id -> [ruta, ...]
  for (const archivo of archivos) {
    if (!esTipoValido(archivo.data.tipo)) continue;

    const titulo = typeof archivo.data.titulo === 'string' ? archivo.data.titulo.trim() : '';
    if (!titulo) {
      errores.push({ ruta: archivo.rutaPosix, mensaje: `Falta 'titulo'.` });
    }

    const id = typeof archivo.data.id === 'string' ? archivo.data.id.trim() : '';
    if (!id) continue;

    const prefijoEsperado = TIPOS[archivo.data.tipo].prefijoId;
    if (!id.startsWith(`${prefijoEsperado}.`)) {
      errores.push({
        ruta: archivo.rutaPosix,
        mensaje: `El id '${id}' debe empezar con '${prefijoEsperado}.' (tipo: ${archivo.data.tipo}).`,
      });
    }

    // Aviso: el slug del id debería coincidir con el nombre del archivo.
    const base = path.basename(archivo.rutaRelativa, '.md');
    const slugEsperado = `${prefijoEsperado}.${base}`;
    if (id !== slugEsperado && id.startsWith(`${prefijoEsperado}.`)) {
      advertencias.push({
        ruta: archivo.rutaPosix,
        mensaje: `El id '${id}' no coincide con el nombre del archivo ('${slugEsperado}').`,
      });
    }

    const previos = idsPorArchivo.get(id) ?? [];
    previos.push(archivo.rutaPosix);
    idsPorArchivo.set(id, previos);
  }

  // Paso 3: detectar ids duplicados.
  for (const [id, rutas] of idsPorArchivo) {
    if (rutas.length > 1) {
      errores.push({
        ruta: rutas.join(', '),
        mensaje: `Id duplicado '${id}' en ${rutas.length} archivos.`,
      });
    }
  }

  const idsDefinidos = new Set(idsPorArchivo.keys());

  // Paso 4: validar referencias.
  for (const archivo of archivos) {
    if (!esTipoValido(archivo.data.tipo)) continue;

    for (const campo of CAMPOS_CON_REFERENCIAS) {
      const valores = normalizarLista(archivo.data[campo]);
      for (const v of valores) {
        if (!reReferenciaId.test(v)) continue; // texto libre
        if (!idsDefinidos.has(v)) {
          errores.push({
            ruta: archivo.rutaPosix,
            mensaje: `Referencia rota en '${campo}': '${v}' no existe.`,
          });
        }
      }
    }
  }

  // Reporte final.
  const nCorreccionesAplicadas = correccionesAplicadas.length;
  const nPendientes = correccionesPendientes.length;

  if (nCorreccionesAplicadas > 0) {
    console.log(`\n✎ ${nCorreccionesAplicadas} corrección(es) aplicada(s) automáticamente:`);
    for (const c of correccionesAplicadas) console.log('  · ' + c);
  }

  if (nPendientes > 0 && modoCheck) {
    console.log(`\n⚠ ${nPendientes} corrección(es) pendiente(s) (ejecuta con --fix):`);
    for (const c of correccionesPendientes) console.log('  · ' + c);
  }

  if (advertencias.length > 0) {
    console.log(`\n⚠ ${advertencias.length} advertencia(s):`);
    for (const a of advertencias) console.log(`  · ${a.ruta}: ${a.mensaje}`);
  }

  if (errores.length > 0) {
    console.error(`\n✘ ${errores.length} error(es):`);
    for (const e of errores) console.error(`  · ${e.ruta}: ${e.mensaje}`);
    console.error(`\nBuild abortado por errores de validación.`);
    process.exit(1);
  }

  console.log(`\n✔ ${archivos.length} recursos validados sin errores.`);
}

validar().catch((err) => {
  console.error(err);
  process.exit(1);
});
