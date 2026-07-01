'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const cron = require('node-cron');
const { readFeed } = require('./lib/cache');
const { refreshFeed } = require('./lib/refresh');

const PORT = process.env.PORT || 3000;
const CRON_TIMEZONE = process.env.CRON_TIMEZONE || 'America/Mexico_City';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const app = express();
app.use(express.json());

let isRefreshing = false;

async function runRefresh(trigger) {
  if (isRefreshing) {
    console.log(`[refresh] Ya hay un refresh en curso, se ignora el disparo de "${trigger}"`);
    return null;
  }
  isRefreshing = true;
  console.log(`[refresh] Iniciando actualizacion (${trigger})...`);
  try {
    const feed = await refreshFeed();
    console.log(`[refresh] Completado (${trigger}). Items: news=${feed.categories.news.length}, courses=${feed.categories.courses.length}, edtech=${feed.categories.edtech.length}`);
    if (feed.sourceErrors.length) {
      feed.sourceErrors.forEach((e) => console.warn(`[refresh] ${e}`));
    }
    return feed;
  } catch (err) {
    console.error(`[refresh] Fallo (${trigger}):`, err.message);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

app.get('/api/feed', (req, res) => {
  res.json(readFeed());
});

app.post('/api/refresh', async (req, res) => {
  if (!REFRESH_TOKEN) {
    return res.status(503).json({ error: 'REFRESH_TOKEN no configurado en el servidor' });
  }
  const provided = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (provided !== REFRESH_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (isRefreshing) {
    return res.status(409).json({ error: 'Ya hay una actualizacion en curso' });
  }
  try {
    const feed = await runRefresh('manual /api/refresh');
    res.json({ ok: true, updatedAt: feed.updatedAt });
  } catch (err) {
    res.status(500).json({ error: 'La actualizacion fallo', detail: err.message });
  }
});

const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// Actualizacion automatica todos los dias a las 7:00 AM (hora local del DIT).
// El cron corre dentro de este proceso: si Lienzo reinicia el proceso Node
// antes de que dispare, usa POST /api/refresh (con un cron externo o un ping
// desde la PGX) como respaldo.
cron.schedule('0 7 * * *', () => runRefresh('cron 7:00 AM'), { timezone: CRON_TIMEZONE });

app.listen(PORT, () => {
  console.log(`MARK-DIT escuchando en http://localhost:${PORT} (cron 7:00 AM, tz ${CRON_TIMEZONE})`);
});
