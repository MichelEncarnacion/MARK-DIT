'use strict';

const { summarizeItem } = require('./deepseek');
const { writeFeed } = require('./cache');
const news = require('../sources/news');
const courses = require('../sources/courses');
const edtech = require('../sources/edtech');

const MAX_ITEMS_PER_CATEGORY = 6;

const SOURCE_MODULES = [
  { category: 'news', label: 'Noticias', fetch: news.fetchNews },
  { category: 'courses', label: 'Cursos IA', fetch: courses.fetchCourses },
  { category: 'edtech', label: 'Tech Educativa', fetch: edtech.fetchEdtech },
];

/**
 * Procesa un item crudo con DeepSeek. Si el LLM falla para este item
 * puntual, no se rompe todo el refresh: se usa el texto original como
 * respaldo y se registra el error.
 */
async function processItem(item, category, errors) {
  try {
    const summary = await summarizeItem({ ...item, category });
    return { ...item, category, summary };
  } catch (err) {
    errors.push(`DeepSeek fallo en "${item.title}": ${err.message}`);
    const fallback = item.rawSummary
      ? item.rawSummary.slice(0, 220)
      : 'Resumen no disponible por el momento.';
    return { ...item, category, summary: fallback };
  }
}

async function refreshFeed() {
  const errors = [];
  const categories = { news: [], courses: [], edtech: [] };

  for (const mod of SOURCE_MODULES) {
    const { items: rawItems, errors: fetchErrors } = await mod.fetch();
    errors.push(...fetchErrors);

    const trimmed = rawItems.slice(0, MAX_ITEMS_PER_CATEGORY);
    const processed = [];
    for (const item of trimmed) {
      processed.push(await processItem(item, mod.category, errors));
    }
    categories[mod.category] = processed;
  }

  const feed = {
    updatedAt: new Date().toISOString(),
    categories,
    sourceErrors: errors,
  };

  writeFeed(feed);
  return feed;
}

module.exports = { refreshFeed };
