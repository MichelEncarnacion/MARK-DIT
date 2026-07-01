'use strict';

const { fetchFeed } = require('../lib/rss');
const { gather } = require('../lib/sourceUtils');

/**
 * Noticias tech/IA. Dos feeds RSS oficiales, en paralelo e independientes:
 * si uno falla el otro sigue alimentando la seccion.
 */
const FEEDS = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Technology Review' },
];

function fetchNews() {
  return gather(FEEDS.map((f) => ({ label: f.name, run: () => fetchFeed(f.url, f.name) })));
}

module.exports = { fetchNews, category: 'news' };
