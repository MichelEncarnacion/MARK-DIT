'use strict';

const Parser = require('rss-parser');
const parser = new Parser({ timeout: 15000 });

/**
 * Descarga y parsea un feed RSS/Atom. Lanza si falla; quien la llama
 * decide como agregar el error sin tumbar las demas fuentes (ver lib/sourceUtils.js).
 */
async function fetchFeed(url, sourceName) {
  const feed = await parser.parseURL(url);
  return (feed.items || []).map((item) => ({
    title: item.title?.trim() || 'Sin titulo',
    link: item.link || item.guid || url,
    source: sourceName,
    publishedAt: item.isoDate || item.pubDate || null,
    rawSummary: (item.contentSnippet || item.content || item.summary || '').slice(0, 800),
  }));
}

module.exports = { fetchFeed };
