# MARK-DIT

Bot informativo tech de la Dirección de Innovación Tecnológica (DIT) de la Red Educativa SPES
(UPAEP, UIC, Prepa UPAEP, Colegios Altum, IESDE). Muestra, actualizado diariamente:

- **Noticias** tech/IA relevantes.
- **Cursos IA** gratis, priorizando los cursos oficiales de Anthropic/Claude.
- **Tech Educativa** — herramientas y novedades útiles para instituciones educativas.

Cada resumen lo genera el LLM propio del DIT (DeepSeek R1 70B en la ThinkStation PGX) con la
personalidad de MARK-DIT. Cada tarjeta y cada sección tienen un botón 🔊 para que MARK-DIT lea
el contenido en voz alta (español), usando la Web Speech API del navegador — sin backend, sin
costo y sin API keys adicionales. La calidad/disponibilidad de la voz depende del navegador y
sistema operativo de quien visita el sitio.

## Arquitectura

```
server.js            Express + node-cron. Sirve la API y el frontend ya buildeado.
sources/              Un módulo por fuente (news, courses, edtech). Si una fuente falla,
                       las demás siguen funcionando (ver lib/sourceUtils.js).
lib/deepseek.js        Cliente del LLM (OpenAI-compatible) + filtro de bloques <think>.
lib/rss.js              Helper para leer feeds RSS/Atom.
lib/sourceUtils.js       Corre varias fuentes en paralelo, aísla errores por fuente.
lib/refresh.js            Orquesta: junta fuentes -> resume con DeepSeek -> escribe cache.
lib/cache.js               Lee/escribe data/feed.json de forma atómica.
scripts/refresh.js          CLI para forzar un refresh sin levantar el servidor.
data/feed.json                Caché servida por la API (se genera en runtime, no se versiona).
client/                        Frontend en React (Vite).
```

El sitio **siempre** sirve desde `data/feed.json`. El cron (7:00 AM, zona horaria configurable)
y el endpoint `POST /api/refresh` son los únicos que regeneran ese archivo.

## Fuentes de datos elegidas

| Categoría | Fuente | Tipo |
|---|---|---|
| Noticias | TechCrunch (categoría IA), MIT Technology Review | RSS oficial |
| Cursos IA | `anthropics/courses` (repo oficial de Anthropic) | GitHub API |
| Cursos IA | Class Central (`/report/feed`, filtrado por palabras clave de IA) | RSS |
| Tech Educativa | EdSurge, eSchool News | RSS oficial |

> **Nota importante:** el sandbox donde se desarrolló este proyecto bloquea por política de red
> la mayoría de dominios externos (solo permite `npm`, `github.com`/`api.github.com`, etc.), así
> que estas URLs de RSS **no pudieron probarse en vivo** desde aquí — sí se verificó que
> `anthropics/courses` existe y responde vía GitHub API. Cada fuente es un archivo independiente
> en `sources/`, así que si alguna URL cambió o dejó de funcionar, se corrige ahí sin tocar el
> resto del sistema. Corran `npm run refresh` después del primer deploy para confirmar que todo
> jala con acceso a internet normal.

## Configuración

```bash
cp .env.example .env
```

Completa `.env`:

- `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`: credenciales del LLM propio.
  **Nunca** se hardcodean en el código ni se suben al repo — van solo en variables de entorno
  (locales en `.env`, y como *secrets*/variables de entorno en Lienzo al desplegar).
- `REFRESH_TOKEN`: token propio para autorizar `POST /api/refresh` (header
  `Authorization: Bearer <token>`).
- `CRON_TIMEZONE`: zona horaria del cron diario (default `America/Mexico_City`).

## Correr localmente

```bash
npm install
npm run build        # compila el frontend (client/) a client/dist
npm run refresh       # primer llenado de data/feed.json (usa DeepSeek + fuentes reales)
npm start             # levanta el servidor en http://localhost:3000
```

Para desarrollar el frontend con hot-reload (proxyea /api hacia el server en :3000):

```bash
npm start             # en una terminal
npm run dev:client    # en otra, sirve el front en modo dev
```

## Endpoints

- `GET /api/feed` — feed cacheado (lo que consume el frontend).
- `POST /api/refresh` — fuerza una actualización. Requiere `Authorization: Bearer $REFRESH_TOKEN`.

## Despliegue en Lienzo

Este proyecto se construyó para publicarse con el skill `lienzo-mcp`, pero esa herramienta no
estuvo disponible en el entorno donde se generó este código, así que el despliegue final queda
pendiente de que alguien con ese skill (o acceso directo a Lienzo) lo ejecute. Pasos sugeridos:

1. `npm run build` para generar `client/dist`.
2. Configurar en Lienzo las variables de entorno de `.env.example` (con los valores reales).
3. Arrancar con `npm start` (Lienzo hospeda Node.js; no requiere Docker ni Python).

### Riesgo conocido: persistencia del proceso Node y el cron de las 7 AM

El cron de `node-cron` corre **dentro** del proceso Node. Si Lienzo reinicia los procesos
periódicamente, ese cron podría no dispararse todos los días. Por eso existe
`POST /api/refresh`: si se confirma que Lienzo no mantiene el proceso vivo 24/7, hay que apuntar
un disparador externo (un cron externo, o la propia PGX) a ese endpoint como respaldo. Confirmar
este comportamiento con la documentación de Lienzo antes de depender solo del cron interno.

## Seguridad

- Las llamadas a DeepSeek ocurren únicamente en el backend; el API key nunca llega al frontend.
- `POST /api/refresh` requiere un token (`REFRESH_TOKEN`) — sin él, responde `503`; con token
  incorrecto, `401`.
- `data/feed.json` y `.env` están en `.gitignore`: no se suben credenciales ni contenido
  generado al repositorio.
