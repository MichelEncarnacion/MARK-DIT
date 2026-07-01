'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FEED_PATH = path.join(DATA_DIR, 'feed.json');

const EMPTY_FEED = {
  updatedAt: null,
  categories: {
    news: [],
    courses: [],
    edtech: [],
  },
  sourceErrors: [],
};

function readFeed() {
  try {
    const raw = fs.readFileSync(FEED_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return EMPTY_FEED;
  }
}

/**
 * Escritura atomica: escribe a un archivo temporal y luego renombra,
 * asi el servidor nunca llega a leer un feed.json a medio escribir.
 */
function writeFeed(feed) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${FEED_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(tmpPath, JSON.stringify(feed, null, 2), 'utf-8');
  fs.renameSync(tmpPath, FEED_PATH);
}

module.exports = { readFeed, writeFeed, EMPTY_FEED, FEED_PATH };
