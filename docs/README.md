# Nimbus AI — Engineering Blueprint

A from-scratch, beginner-friendly explanation of how Nimbus AI is built: how the
Angular dashboard talks to its own Express backend, how that backend hides your
API keys from WeatherAPI and Groq, how the AI weather insight streams in word by
word, and how a push to `main`/`master` ends up live on Vercel and Render.

## Reading order

1. [01-ARCHITECTURE.md](./01-ARCHITECTURE.md) — the big picture: why there's a
   backend at all for what looks like "just a weather app," and how a search
   request flows through all three services.
2. [02-BACKEND.md](./02-BACKEND.md) — the Express server: the weather proxy, the
   city-search proxy, and the streaming AI insight endpoint, explained line by
   line.
3. [03-FRONTEND.md](./03-FRONTEND.md) — the Angular dashboard: how it's built
   almost entirely from Signals held directly on one component, why that's a
   reasonable choice here, geolocation with a graceful fallback, debounced search,
   and consuming a streaming HTTP response in the browser.
4. [04-FEATURES.md](./04-FEATURES.md) — every widget on the dashboard, what it
   shows, and why it's built the way it is — including the two things just fixed
   (the favicon, and the forecast length).
5. [05-DEPLOYMENT.md](./05-DEPLOYMENT.md) — Vercel + Render + GitHub Actions, the
   Render free-tier cold-start quirk, and environment variables.
6. [GLOSSARY.md](./GLOSSARY.md) — every term used above, defined plainly.

## What this project is, in one paragraph

Nimbus AI is a single-page weather dashboard: search any city (or let it use your
current location) and see current conditions, an hourly timeline, a multi-day
forecast, a temperature trend chart, wind, air quality, an interactive map, and a
short AI-generated sentence describing how the weather *feels* — not just the
raw numbers. The Angular frontend never talks to WeatherAPI or Groq directly; a
small Express backend sits in between, both to keep the API keys secret and to
shape the AI response as a live-typing stream.
