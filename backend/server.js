'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// In Docker the frontend is copied to ./public; in the repo it lives at ../public.
const PUBLIC_DIR = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public'),
].find((p) => fs.existsSync(p)) || path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

/* Tiny email sanity check (not RFC-perfect, just enough to keep junk out). */
const isEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

/* ---- API ---- */

// Health check (Render pings this).
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Current view total.
app.get('/api/stats', async (_req, res) => {
  try {
    res.json({ views: await db.getViews() });
  } catch (err) {
    console.error('GET /api/stats', err.message);
    res.status(500).json({ error: 'stats_unavailable' });
  }
});

// Register one page view, return the new total.
app.post('/api/view', async (_req, res) => {
  try {
    res.json({ views: await db.incrementViews() });
  } catch (err) {
    console.error('POST /api/view', err.message);
    res.status(500).json({ error: 'view_failed' });
  }
});

// Newsletter signup.
app.post('/api/subscribe', async (req, res) => {
  const email = (req.body && req.body.email || '').trim().toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  try {
    await db.addSubscriber(email);
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/subscribe', err.message);
    res.status(500).json({ error: 'subscribe_failed' });
  }
});

// Contact form.
app.post('/api/contact', async (req, res) => {
  const name = (req.body && req.body.name || '').trim().slice(0, 120);
  const email = (req.body && req.body.email || '').trim().toLowerCase();
  const body = (req.body && req.body.body || '').trim().slice(0, 4000);
  if (!body) return res.status(400).json({ error: 'empty_message' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  try {
    await db.addMessage(name, email, body);
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/contact', err.message);
    res.status(500).json({ error: 'contact_failed' });
  }
});

/* ---- Static site ---- */
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (/\.(jpg|jpeg|png|webp|svg|ico)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
      }
    },
  })
);

// Anything else falls back to the article.
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

/* ---- Boot ---- */
db.init()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialise database:', err.message);
    // Still serve the static site even if the DB is unreachable.
    app.listen(PORT, () =>
      console.log(`Server listening on :${PORT} (DB init failed, running degraded)`)
    );
  });
