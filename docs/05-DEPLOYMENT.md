# 5. Deployment — Three Separate Pieces, Three Separate Homes

## Where each piece lives

| Piece | Hosted on | Deploys on |
|---|---|---|
| Angular frontend | **Vercel** | push to `master` |
| Express backend | **Render** | push to `master` |
| — | **GitHub Actions** | push to `master` — build validation only, not a deploy |

```mermaid
sequenceDiagram
    participant Dev as Developer (git push)
    participant GH as GitHub (master)
    participant Actions as GitHub Actions
    participant Vercel
    participant Render

    Dev->>GH: git push origin master
    GH-->>Actions: run build.yml
    Actions->>Actions: npm install && ng build (frontend)
    Actions->>Actions: npm install (backend, server/)
    par
        GH-->>Vercel: webhook: new commit
        Vercel->>Vercel: ng build, publish to CDN
    and
        GH-->>Render: webhook: new commit
        Render->>Render: npm install, restart Node process
    end
```

Vercel and Render both watch the same repository and branch independently, and
neither one depends on GitHub Actions to succeed first — **GitHub Actions here
is a build-health check, not a deployment gate.** If `build.yml` fails, Vercel
and Render still deploy; the workflow exists so a broken build is visible in the
GitHub Actions tab (and in a pull request's checks) without needing to wait for
either host's own build logs.

## Environment variables

Two secrets, `GROQ_API_KEY` and `WEATHER_API_KEY`, are needed only by the
backend (the frontend never sees them — see
[01-ARCHITECTURE.md](./01-ARCHITECTURE.md) for why). Locally they live in
`server/.env` (gitignored); on Render they're set as environment variables in
the service's own dashboard, the same names, read the same way via
`dotenv`/`process.env`.

The frontend has its own environment split instead —
[`environment.ts`](../src/environments/environment.ts) (local dev, pointing at
`http://localhost:3000`) vs
[`environment.prod.ts`](../src/environments/environment.prod.ts) (pointing at
the real Render URL) — swapped automatically by `ng build` depending on whether
it's a development or production build.

## The Render free-tier cold start

The backend runs on Render's free tier, which spins the service down after a
period of inactivity and takes a few seconds to spin back up on the next
request. This is why the very first search after the site's been idle for a
while can feel noticeably slower than every search after it — it isn't a bug in
this project's code, it's the tradeoff of the free hosting tier. The
`README.md`'s "Live Demo" section calls this out directly so it isn't mistaken
for a real performance problem.

## What a full local run looks like

1. **Backend:** `cd server`, `npm install`, create `server/.env` with
   `GROQ_API_KEY` and `WEATHER_API_KEY`, then `npm run dev`. Listens on
   `http://localhost:3000`.
2. **Frontend:** from the repo root, `npm install`, then `ng serve`. Listens on
   `http://localhost:4200` and talks to the backend at the URL in
   `environment.ts`.

Both need to be running together — the dashboard's search box works with the
backend down, but every search will fail without it.

Next: [GLOSSARY.md](./GLOSSARY.md) — every term used across these docs, defined
plainly.
