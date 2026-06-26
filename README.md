# مَرصَد — Lebanon 2019–2026 (ad-ready news site)

A single, polished Arabic long-form feature about Lebanon's 2019–2026 crisis, built as a
real website you can put online and monetize.

- **Frontend:** vanilla HTML/CSS/JS (RTL, responsive — works on desktop, iPhone, Android)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (live view counter, newsletter signups, contact messages)
- **Everything in Docker**, one-command local run
- **Deploys to Render free tier** via `render.yaml`
- **Ad slots already wired in** for Google AdSense (just paste your IDs)

---

## ⚠️ First, the honest part about "more views = more money"

Roughly yes, but with big caveats — better to know them now:

1. **You can't show Google ads until AdSense approves your site.** In 2026, approval needs
   original content, essential pages (About / Contact / Privacy — all included here), a clean
   responsive design (included), and ideally **more than one article**. A site with a *single*
   page is the #1 reason for the "low-value content / not enough content" rejection. **Plan to
   add 10–20 more articles before applying.** The structure here makes that easy.
2. **Views pay very little per view.** Typical earnings are a *few dollars per 1,000 views*.
   To make ~$1,000/month you generally need ~100,000+ visits/month. Traffic from Lebanon/MENA
   pays less per click than the US/EU, so you'd need more of it.
3. **Never click your own ads** and never buy fake traffic — both get you banned fast.

So this site is **monetization-ready**, but the money comes from *traffic + more content over
time*, not from the code alone. The live view counter in the header lets you watch it grow.

---

## Run locally (Docker — easiest)

```bash
docker compose up --build
```

Open http://localhost:3000 . Postgres + the app start together. To stop: `Ctrl+C`, then
`docker compose down` (add `-v` to also wipe the database).

## Run locally without Docker

You need a local PostgreSQL. Then:

```bash
cp .env.example .env          # adjust DATABASE_URL if needed
cd backend && npm install
DATABASE_URL=postgres://lebanon:lebanon@localhost:5432/lebanon DATABASE_SSL=false node server.js
```

---

## Deploy to Render (free) — make it live

1. Push this folder to a **GitHub** repo.
2. On Render: **New + → Blueprint**, connect the repo. Render reads `render.yaml` and creates
   **both** the web service and a free PostgreSQL database, wiring `DATABASE_URL` automatically.
3. Click **Apply**, wait for the build, and you get a public `https://...onrender.com` URL.

Notes:
- The free web service **sleeps after ~15 min idle** and takes a few seconds to wake on the
  first visit. The free database also expires after a period — Render will warn you; upgrade or
  recreate it when that happens.
- SSL to the database is handled automatically in production (`db.js`).

---

## Turn on Google ads (after AdSense approval)

1. Apply at https://adsense.google.com with your live Render URL.
2. Once approved, in **`public/index.html`**:
   - Replace `ca-pub-XXXXXXXXXXXXXXXX` with your publisher ID.
   - Uncomment the AdSense `<script>` in `<head>`.
   - In each `.ad` block, uncomment the `<ins class="adsbygoogle">` unit and set its
     `data-ad-slot` (you create slot IDs in the AdSense dashboard).
3. Put your real publisher line in **`public/ads.txt`**.

There are three ad slots ready: a leaderboard under the hero, an in-article unit, and the
placeholders are clearly commented.

---

## Project structure

```
lebanon-site/
├── backend/
│   ├── server.js        Express app + JSON API
│   ├── db.js            PostgreSQL pool, schema, helpers
│   └── package.json
├── public/              the website (served as static files)
│   ├── index.html       the feature article
│   ├── about / contact / privacy .html
│   ├── css/style.css
│   ├── js/app.js        views, timeline highlight, newsletter
│   ├── images/          optimized photos
│   ├── ads.txt · robots.txt · sitemap.xml · favicon.svg
├── Dockerfile
├── docker-compose.yml
├── render.yaml          Render blueprint
└── .env.example
```

## API

| Method | Path             | Purpose                          |
|--------|------------------|----------------------------------|
| GET    | `/healthz`       | health check                     |
| GET    | `/api/stats`     | current view total               |
| POST   | `/api/view`      | +1 view, returns new total       |
| POST   | `/api/subscribe` | `{ email }` → newsletter         |
| POST   | `/api/contact`   | `{ name?, email?, body }`        |

## Next steps to actually earn

- Add more articles (duplicate `index.html`, change the content, link them from a simple
  homepage). Aim for 10–20 before applying to AdSense.
- Share each piece where your audience already is — that's your traffic engine.
- Once you have steady traffic, look at higher-paying networks (e.g. Ezoic, Mediavine) which
  need traffic minimums but pay more than AdSense.

> The images and article text were provided by you. Replace any third-party photos with ones
> you own or have a license for before applying to AdSense (Google requires this).
