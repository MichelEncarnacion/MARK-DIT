# Documentación de MARK-DIT

Este documento describe qué se implementó en el proyecto MARK-DIT, cómo funciona y por qué se
tomaron ciertas decisiones. Complementa a `README.md` (instrucciones de uso/despliegue) y a
`CLAUDE.md` (guía rápida para trabajar en el código con Claude Code).

## 1. Qué es MARK-DIT

Bot informativo tech para la Dirección de Innovación Tecnológica (DIT) de la Red Educativa SPES
(UPAEP, UIC, Prepa UPAEP, Colegios Altum, IESDE). Es un sitio web que muestra, actualizado
diariamente, tres categorías de contenido:

1. **Noticias** tech/IA relevantes.
2. **Cursos IA** gratis, con prioridad en cursos oficiales de Anthropic/Claude.
3. **Tech Educativa** — herramientas y novedades útiles para instituciones educativas.

Cada ítem se muestra con título, resumen corto, fuente/link original, categoría y fecha. Los
resúmenes los genera el LLM propio del DIT (DeepSeek R1 70B, corriendo en una ThinkStation PGX)
con la personalidad del bot ("MARK-DIT"), nunca un resumen genérico de la fuente original.

## 2. Funcionalidades implementadas

- **Agregación de contenido en 3 categorías**, cada una alimentada por fuentes independientes
  (ver sección 4).
- **Resumen con personalidad**: cada ítem crudo se envía al LLM propio con un system prompt fijo
  (tono "Jarvis pero humano", español mexicano, siempre explica por qué algo importa para la
  educación/el DIT, nunca inventa datos). Ver `lib/deepseek.js`.
- **Filtro de razonamiento del modelo**: DeepSeek R1 devuelve bloques `<think>...</think>` con su
  razonamiento interno; se filtran antes de guardar o mostrar cualquier texto.
- **Caché en disco** (`data/feed.json`): el sitio siempre sirve desde ahí, nunca golpea las
  fuentes ni el LLM en el camino de una petición normal.
- **Actualización automática diaria** a las 7:00 AM (zona horaria configurable) vía `node-cron`,
  más un endpoint `POST /api/refresh` protegido por token para forzar una actualización manual
  (pensado como respaldo si Lienzo reinicia el proceso Node antes de las 7 AM — ver sección 6).
- **Manejo de errores aislado por fuente**: si una fuente RSS/API se cae, las demás siguen
  funcionando; los errores quedan registrados tanto en logs como en `feed.json`
  (`sourceErrors`), visibles para quien de mantenimiento sin necesitar acceso a logs de Lienzo.
- **Frontend en React** (Vite): hero con nombre del bot y fecha, 3 secciones con tarjetas,
  paleta azul marino SPES (`#00305F`), diseño responsive, modo claro/oscuro con persistencia en
  `localStorage`.
- **Lectura en voz alta**: cada tarjeta tiene un botón 🔊 para que MARK-DIT lea el título y
  resumen en voz alta, y cada sección tiene un botón "Leer sección" que lee todos sus ítems en
  secuencia. Implementado 100% en el navegador con la Web Speech API nativa (`SpeechSynthesis`),
  sin backend ni costo adicional — ver sección 5.
- **Seguridad de credenciales**: las llamadas al LLM ocurren solo en el backend; el API key nunca
  se expone al frontend ni se hardcodea en el código (todo vía variables de entorno).

## 3. Arquitectura y flujo de datos

```
sources/{news,courses,edtech}.js   (RSS / GitHub API, por categoria)
        │  cada fuente devuelve { items, errors }, nunca lanza
        ▼
lib/sourceUtils.js#gather()         Promise.allSettled sobre varias fuentes de una categoria
        ▼
lib/refresh.js#refreshFeed()        junta categorias, resume cada item con DeepSeek,
        │                           usa un fallback (texto crudo) si el LLM falla en un item
        ▼
lib/deepseek.js#summarizeItem()     llama al LLM propio, filtra <think>, aplica la personalidad
        ▼
lib/cache.js#writeFeed()            escritura atomica (tmp + rename) de data/feed.json
        ▼
server.js  GET /api/feed            siempre lee del cache, nunca dispara un refresh
server.js  POST /api/refresh        dispara refreshFeed() bajo demanda (token + lock anti-solape)
server.js  cron 7:00 AM             dispara refreshFeed() automaticamente
        ▼
client/ (React)                     fetch a /api/feed, renderiza Hero + 3 Section + Card
```

Puntos de diseño relevantes:

- **Cache-first**: separar "servir" de "actualizar" significa que el sitio siempre responde
  rápido y nunca depende de que las fuentes externas o el LLM estén disponibles en el momento en
  que alguien visita la página.
- **Un módulo por fuente**: agregar o quitar una fuente de RSS/API no toca el resto del sistema.
- **Nada de estado compartido implícito**: cada fuente y cada llamada al LLM son independientes;
  un fallo se captura y se convierte en un string de error o en un resumen de respaldo, nunca en
  una excepción que tumbe todo el refresh.

## 4. Fuentes de datos y por qué se eligieron

| Categoría | Fuente | Tipo | Motivo |
|---|---|---|---|
| Noticias | TechCrunch (categoría IA) | RSS oficial | Medio reconocido, RSS estable y gratuito |
| Noticias | MIT Technology Review | RSS oficial | Rigor editorial, cobertura de IA de calidad |
| Cursos IA | `anthropics/courses` | GitHub API | Repo **oficial** de Anthropic con cursos gratis — Anthropic no publica RSS propio, así que se usa su repo público en vez de scraping o una fuente no oficial |
| Cursos IA | Class Central (`/report/feed`) | RSS, filtrado por palabras clave de IA | Catálogo agregador de cursos gratis de múltiples plataformas de calidad (DeepLearning.AI, Google, universidades, etc.) |
| Tech Educativa | EdSurge | RSS oficial | Medio de referencia en noticias edtech |
| Tech Educativa | eSchool News | RSS oficial | Cobertura de tecnología para instituciones K-12/superior |

Se priorizó en este orden, como se pidió: RSS oficial → API oficial → scraping (no se usó
scraping en ningún caso; no fue necesario).

**Limitación conocida**: el entorno donde se desarrolló este proyecto bloquea por política de
red la mayoría de dominios externos (solo permite `npm`, `github.com`/`api.github.com`, etc.),
así que estas URLs de RSS no se pudieron probar con tráfico real desde ahí — sí se confirmó que
`anthropics/courses` existe y responde vía GitHub API. Cada fuente es un módulo independiente, así
que si alguna URL cambió o dejó de funcionar, se corrige en `sources/*.js` sin tocar el resto.
Correr `npm run refresh` con acceso a internet normal (por ejemplo, ya desplegado en Lienzo) es
la forma de confirmarlo.

## 5. Lectura en voz alta

Implementada con la Web Speech API del navegador (`window.speechSynthesis`), en
`client/src/context/SpeechContext.jsx`:

- Un solo "reproductor" global (`speakingId`) evita que se traslapen dos lecturas: iniciar una
  nueva cancela la anterior.
- Intenta elegir una voz en español (`es-MX` o cualquier `es-*` disponible) cuando el navegador
  expone su lista de voces; si no hay ninguna, usa la voz por defecto del navegador.
- No hay backend de texto-a-voz ni generación de audio en el servidor: todo corre en el
  dispositivo de quien visita el sitio, sin costo y sin necesidad de credenciales.
- Se degrada con gracia: si `speechSynthesis` no existe o el navegador no tiene voces, los
  botones de lectura simplemente no aparecen o no producen sonido, sin romper el resto del sitio.

## 6. Automatización y riesgo conocido en Lienzo

El cron de `node-cron` corre **dentro** del proceso Node (`server.js`), programado a las 7:00 AM
en la zona horaria de `CRON_TIMEZONE` (default `America/Mexico_City`). Si Lienzo reinicia el
proceso periódicamente, ese cron podría no dispararse todos los días — por diseño, `POST
/api/refresh` existe como respaldo para que un disparador externo (un cron externo o la propia
PGX) fuerce la actualización si hace falta. Esto quedó pendiente de confirmar con la
documentación de Lienzo (ver README, sección "Despliegue en Lienzo").

## 7. Seguridad

- `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY` y `DEEPSEEK_MODEL` solo se leen de variables de
  entorno (`process.env`), nunca se hardcodean en el código ni se suben al repositorio
  (`.env` y `data/feed.json` están en `.gitignore`).
- Todas las llamadas al LLM ocurren en el backend (`lib/deepseek.js`); el frontend solo consume
  `GET /api/feed`, por lo que la API key nunca llega al navegador.
- `POST /api/refresh` requiere `Authorization: Bearer $REFRESH_TOKEN`; responde `503` si el
  servidor no tiene `REFRESH_TOKEN` configurado, `401` si el token no coincide, y `409` si ya hay
  una actualización en curso.

## 8. Pendientes

- Publicar en Lienzo — el skill `lienzo-mcp` no estuvo disponible en el entorno de desarrollo de
  este proyecto, así que el despliegue final queda para quien tenga ese skill o acceso directo a
  Lienzo (pasos en `README.md`).
- Verificar las fuentes RSS con acceso a internet real (no se pudieron probar en vivo desde el
  sandbox de desarrollo, ver sección 4).
- Confirmar si el proceso Node de Lienzo persiste 24/7 para el cron interno, o si hace falta un
  disparador externo hacia `POST /api/refresh` (ver sección 6).
