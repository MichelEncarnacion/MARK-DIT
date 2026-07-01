'use strict';

require('dotenv').config();
const { refreshFeed } = require('../lib/refresh');

refreshFeed()
  .then((feed) => {
    const counts = Object.fromEntries(
      Object.entries(feed.categories).map(([k, v]) => [k, v.length])
    );
    console.log('Feed actualizado:', counts);
    if (feed.sourceErrors.length) {
      console.log('Errores durante el refresh:');
      feed.sourceErrors.forEach((e) => console.log(' -', e));
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Refresh fallo por completo:', err);
    process.exit(1);
  });
