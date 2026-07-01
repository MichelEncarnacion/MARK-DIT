'use strict';

const { fetchFeed } = require('../lib/rss');
const { gather } = require('../lib/sourceUtils');

/**
 * Tech util para instituciones educativas (Red UPAEP / SPES).
 * Feeds RSS oficiales de medios especializados en edtech.
 */
const FEEDS = [
  { url: 'https://www.edsurge.com/news.rss', name: 'EdSurge' },
  { url: 'https://www.eschoolnews.com/feed', name: 'eSchool News' },
];

function fetchEdtech() {
  return gather(FEEDS.map((f) => ({ label: f.name, run: () => fetchFeed(f.url, f.name) })));
}

module.exports = { fetchEdtech, category: 'edtech' };
