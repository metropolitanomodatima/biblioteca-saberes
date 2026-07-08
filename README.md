# bilioteca-saberes

Centro de Conocimiento de **MODATIMA**: plataforma colaborativa para organizar, documentar y difundir recursos sobre justicia socioambiental. Reúne argumentarios, investigaciones, campañas, material educativo, legislación y herramientas para fortalecer la formación, la acción territorial y el trabajo de las comunidades.

---

## Estructura del repositorio

### 📁 `recursos/`

Contiene todo el conocimiento de la organización en formato Markdown. Cada recurso representa una unidad de información (argumentario, ley, campaña, guía, concepto, etc.) y constituye la fuente oficial de contenido para la aplicación web.

**Subcarpetas:**

- **`argumentarios/`** — documentos con posiciones oficiales, preguntas frecuentes, respuestas a objeciones y fundamentos sobre distintos temas.
- **`conceptos/`** — definiciones y explicaciones de conceptos clave (ej.: cuenca hidrográfica, justicia ambiental, caudal ecológico).
- **`campañas/`** — información histórica y vigente sobre campañas, objetivos, materiales asociados y resultados.
- **`territorios/`** — fichas de regiones, comunas, cuencas o zonas de interés, con antecedentes, conflictos y organizaciones relacionadas.
- **`leyes/`** — legislación, reglamentos, tratados, jurisprudencia y análisis jurídico.
- **`casos/`** — conflictos socioambientales documentados, con cronología, actores involucrados y documentación de respaldo.
- **`personas/`** — perfiles de referentes, investigadores, dirigentes, autoridades y otras personas relevantes.
- **`organizaciones/`** — fichas de organizaciones sociales, instituciones públicas, ONG, universidades y empresas relacionadas.
- **`eventos/`** — seminarios, encuentros, movilizaciones, actividades y hechos históricos.
- **`biblioteca/`** — documentos de referencia como estudios, informes, libros, publicaciones y material académico.

---

### 📁 `adjuntos/`

Almacena todos los archivos asociados a los recursos.

**Ejemplos:**

- PDF
- imágenes
- infografías
- videos
- audios
- hojas de cálculo
- presentaciones
- documentos originales

> Idealmente, cada recurso mantiene sus archivos organizados en una subcarpeta propia.

---

### 📁 `plantillas/`

Plantillas reutilizables para crear nuevos recursos de forma consistente.

**Ejemplos:**

- plantilla de argumentario
- plantilla de campaña
- plantilla de ley
- plantilla de caso
- plantilla de persona
- plantilla de organización
- plantilla de evento

> Todas las plantillas deben incluir el *frontmatter* estándar del proyecto.

---

### 📁 `scripts/`

Scripts de automatización utilizados para mantener el repositorio.

**Ejemplos:**

- generación del índice de búsqueda
- validación del *frontmatter*
- detección de enlaces rotos
- generación del mapa del sitio
- exportación de contenido
- sincronización con GitHub
- generación de estadísticas

---

### 📁 `sitio/`

Código fuente de la aplicación web.

**Incluye:**

- interfaz de usuario
- buscador
- navegación
- componentes
- estilos
- lectura de recursos Markdown
- renderizado de contenido
- filtros
- páginas
- configuración del despliegue

> Esta carpeta contiene exclusivamente el código de la aplicación; nunca el contenido.

---

### 📄 `README.md`

Documento principal del proyecto.

---

## 🚀 Cómo ejecutar el sitio web

El código de la aplicación está en `sitio/`. Utiliza **Vite + React + TypeScript + Tailwind CSS + React Router + react-markdown + Fuse.js**.

### Requisitos

- Node.js ≥ 20 y npm ≥ 10

### Instalación

```bash
cd sitio
npm install
```

### Desarrollo

```bash
cd sitio
npm run dev
```

El script `dev` primero regenera el índice desde `/recursos` y luego levanta Vite en `http://localhost:5173`.

### Build de producción

```bash
cd sitio
npm run build
```

La salida se escribe en `sitio/dist`.

### Solo regenerar el índice

```bash
cd sitio
npm run indice
```

o bien, desde la raíz del repositorio:

```bash
node scripts/generar-indice.mjs
```

---

## 🔎 Cómo funciona el índice

El script `scripts/generar-indice.mjs`:

1. Recorre recursivamente `/recursos`.
2. Lee cada archivo `.md` y extrae su Frontmatter YAML con `gray-matter`.
3. Copia los `.md` a `sitio/public/recursos/` para servirlos como estáticos.
4. Genera `sitio/public/indice-recursos.json` con los metadatos consolidados.

La aplicación consume ese índice para buscador, filtros y navegación. **La fuente de verdad son los archivos Markdown del repositorio**, no una base de datos.

Ambos archivos generados están en `.gitignore` para evitar ruido en los commits.

---

## ➕ Cómo agregar un nuevo recurso

1. Copia la plantilla correspondiente desde `plantillas/`.
2. Guárdala en la subcarpeta correcta dentro de `recursos/` con nombre en minúsculas y guiones (ej.: `recursos/casos/nombre-del-caso.md`).
3. Completa el Frontmatter YAML. Campos mínimos:
   - `id` (único, formato `tipo.tema.identificador`)
   - `titulo`
   - `tipo` (uno de: `argumentario`, `concepto`, `campaña`, `territorio`, `cuenca`, `ley`, `caso`, `persona`, `organizacion`, `evento`, `biblioteca`)
   - `resumen`
4. Vuelve a ejecutar `npm run indice` (se hace automático en `dev` y `build`).

---

## 🧭 Convenciones

- Los campos `tema`/`temas`, `territorio`/`territorios` se aceptan en singular o plural; el índice los normaliza como listas.
- Las relaciones entre recursos se declaran vía `relacionados:` con la lista de `id` referenciados.
- Prefiere texto plano y Markdown estándar (GFM soportado).
- Nombres de archivo sin acentos ni espacios; el `id` del frontmatter sí puede usar puntos como separador semántico.
