'use strict';

const { Pool } = require('pg');

/*
 * Render's free PostgreSQL requires SSL. Locally (docker-compose) it does not.
 * We turn SSL on in production unless DATABASE_SSL is explicitly "false".
 */
const useSSL =
  process.env.DATABASE_SSL === 'true' ||
  (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL !== 'false');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

/* Create the tables we need if they are not there yet. Runs on every boot. */
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS counters (
      name  TEXT PRIMARY KEY,
      value BIGINT NOT NULL DEFAULT 0
    );
    INSERT INTO counters (name, value) VALUES ('page_views', 0)
      ON CONFLICT (name) DO NOTHING;

    CREATE TABLE IF NOT EXISTS subscribers (
      id         SERIAL PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         SERIAL PRIMARY KEY,
      name       TEXT,
      email      TEXT,
      body       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

/* Atomic +1 on the view counter, returns the new total. */
async function incrementViews() {
  const { rows } = await pool.query(
    `INSERT INTO counters (name, value) VALUES ('page_views', 1)
       ON CONFLICT (name) DO UPDATE SET value = counters.value + 1
       RETURNING value;`
  );
  return Number(rows[0].value);
}

async function getViews() {
  const { rows } = await pool.query(
    `SELECT value FROM counters WHERE name = 'page_views';`
  );
  return rows.length ? Number(rows[0].value) : 0;
}

async function addSubscriber(email) {
  await pool.query(
    `INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING;`,
    [email]
  );
}

async function addMessage(name, email, body) {
  await pool.query(
    `INSERT INTO messages (name, email, body) VALUES ($1, $2, $3);`,
    [name || null, email || null, body]
  );
}

module.exports = {
  pool,
  init,
  incrementViews,
  getViews,
  addSubscriber,
  addMessage,
};
