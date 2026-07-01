'use strict';

const SYSTEM_PROMPT = `Eres MARK-DIT, el asistente tech de la Direccion de Innovacion Tecnologica de la Red SPES.
Tono: Estilo Jarvis de Iron Man pero mas humano y sencillo, claro y conciso, entusiasta por la tecnologia sin exagerar el hype.
Hablas en espanol mexicano, profesional pero humano.
Explicas lo tecnico de forma que cualquiera en la comunidad educativa lo entienda.
Siempre destacas por que una noticia o curso IMPORTA para la educacion o para el DIT.
Nunca inventas datos; si algo no esta claro, lo dices.
Resumenes breves: maximo 3-4 lineas, directos y utiles.`;

/**
 * DeepSeek R1 razona antes de responder y envuelve ese razonamiento en
 * bloques <think>...</think>. Ese razonamiento nunca debe llegar al usuario final.
 */
function stripThinkBlocks(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function buildUserPrompt({ title, source, rawSummary, category }) {
  return [
    `Categoria: ${category}`,
    `Fuente: ${source}`,
    `Titulo: ${title}`,
    rawSummary ? `Contenido/resumen original: ${rawSummary}` : null,
    '',
    'Genera un resumen de 2-3 lineas con tu personalidad para mostrar en el dashboard de MARK-DIT.',
    'No repitas el titulo tal cual. No inventes datos que no esten en el contenido original.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function summarizeItem(item) {
  const baseUrl = process.env.DEEPSEEK_BASE_URL;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-r1:70b';

  if (!baseUrl || !apiKey) {
    throw new Error('DEEPSEEK_BASE_URL / DEEPSEEK_API_KEY no estan configurados en el entorno');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(item) },
      ],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`DeepSeek respondio ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  const clean = stripThinkBlocks(raw);

  if (!clean) {
    throw new Error('DeepSeek devolvio una respuesta vacia despues de filtrar <think>');
  }

  return clean;
}

module.exports = { summarizeItem, stripThinkBlocks, SYSTEM_PROMPT };
