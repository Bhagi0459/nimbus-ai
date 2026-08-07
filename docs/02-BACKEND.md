# 2. Backend — The Express Server, In Full

The entire backend is one file: [`server/index.js`](../server/index.js). No
framework structure beyond Express itself, no folders of controllers/models —
for a handful of endpoints doing proxying, caching, and rate limiting, that's
an appropriate amount of structure, not a shortcut.

## The setup

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Groq = require('groq-sdk');
const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
```

- **`dotenv`** loads `server/.env` (`GROQ_API_KEY`, `WEATHER_API_KEY`) into
  `process.env` when running locally. In production on Render, the same
  variable names are set directly in Render's dashboard instead — `dotenv` finds
  nothing to load there, which is fine, since the variables are already present
  in the environment.
- **`app.set('trust proxy', 1)`** — Render (like most hosting platforms) puts
  the app behind its own reverse proxy, which sets an `X-Forwarded-For` header
  containing the real visitor's IP. By default Express doesn't trust that
  header — anyone could fake it — so it ignores it and rate limiting has no
  reliable way to tell one visitor from another. This line tells Express "the
  first proxy hop in front of me is trustworthy, use its `X-Forwarded-For`
  value as the real client IP." Without it, `express-rate-limit` throws a
  `ValidationError` on every single request instead of actually limiting
  anyone — this was caught live in Render's logs shortly after rate limiting
  was first added, and is exactly the kind of bug that only shows up once
  deployed behind a real proxy, never locally.
- **`cors()`** — without this, the browser would block requests from
  `nimbus-ai-phi.vercel.app` (the frontend's own domain) to
  `nimbus-ai-api.onrender.com` (a *different* domain) as a cross-origin request.
  `cors()` with no options tells Express "allow requests from any origin,"
  appropriate here since this API has no authentication or per-user data to
  protect — it's just a public weather proxy.
- **`express.json()`** — middleware that parses an incoming request's JSON body
  and makes it available as `req.body`. Without it, `req.body` would be
  `undefined` on every POST request.

## Rate limiting — protecting the API keys from abuse

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use(['/api/', '/weather-insight'], apiLimiter);
```

Because this backend has no login system, `WEATHER_API_KEY` and
`GROQ_API_KEY` are only ever protected by the fact that the browser never sees
them directly (see [01-ARCHITECTURE.md](./01-ARCHITECTURE.md)) — but without
anything else in place, a single visitor (or a script) could still hammer
*this* server as fast as it likes, burning through the third-party free-tier
quotas on everyone's behalf. `express-rate-limit` caps that: each unique
client IP gets 60 requests per 15-minute window across every `/api/*` route
and `/weather-insight`; past that, the client gets a `429 Too Many Requests`
response with the friendly JSON message above instead of the real data.
`standardHeaders: true` also returns `RateLimit-*` response headers so a
well-behaved client can see how close it is to the limit.

## Caching — not re-asking WeatherAPI the same question twice

```javascript
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.expiresAt > 0) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
```

A plain JavaScript `Map` living in server memory, keyed by a lowercased
string like `"weather:london"` or `"search:lon"`. Each entry remembers *when
it expires*, not just its data — `getCached` deletes and ignores anything
past that point, so stale weather never lingers. This is intentionally the
simplest thing that works: there's a single Node process and no database (see
[01-ARCHITECTURE.md](./01-ARCHITECTURE.md)), so an in-memory `Map` is enough —
it just means the cache resets whenever the process restarts (e.g. after
Render's free-tier spins it down from inactivity), which is a perfectly
acceptable trade-off here.

Two different lifespans are used, because the two things being cached change
at very different rates:

- **`WEATHER_CACHE_TTL_MS` — 10 minutes.** Current conditions and forecasts
  genuinely change over time, so this cache is short — long enough to absorb
  someone re-searching the same city a few times in a row, short enough that
  the data never feels stale.
- **`SEARCH_CACHE_TTL_MS` — 1 hour.** The list of cities matching a search
  query like `"lon"` barely ever changes, so this cache can safely live much
  longer, cutting down on repeat autocomplete lookups as different visitors
  type similar queries.

## Endpoint 1 — the weather forecast proxy

```javascript
// WeatherAPI's free tier caps forecast lookahead at 3 days (was 7 previously).
const FORECAST_DAYS = 3;

app.get('/api/weather', async (req, res) => {
  try {
    const city = req.query.city;
    const cacheKey = `weather:${city}`.toLowerCase();

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=${FORECAST_DAYS}&aqi=yes`
    );
    const data = await response.json();

    setCached(cacheKey, data, WEATHER_CACHE_TTL_MS);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch weather data' });
  }
});
```

`req.query.city` reads the `?city=...` part of the URL. If there's a fresh
cache entry for that city, it's returned immediately with no external call at
all. Otherwise, it's a plain `fetch` to WeatherAPI's own `forecast.json`
endpoint, with the secret key attached server-side, the result cached, and
the raw JSON handed straight back with `res.json(data)`.

**`FORECAST_DAYS` used to be a hardcoded `days=7`.** WeatherAPI's free tier
changed to only allow 3 days of forecast lookahead, so requesting 7 started
either failing or silently truncating. Pulling it into a single named constant
means the one place this number matters is obvious and easy to bump again later
if the plan ever changes — see [04-FEATURES.md](./04-FEATURES.md) for how the
*frontend* was updated to match (it no longer says "7-Day Forecast" anywhere).

## Endpoint 2 — city search (autocomplete)

```javascript
app.get('/api/weather/search', async (req, res) => {
  try {
    const query = req.query.q;
    const cacheKey = `search:${query}`.toLowerCase();

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await fetch(
      `https://api.weatherapi.com/v1/search.json?key=${process.env.WEATHER_API_KEY}&q=${query}`
    );
    const data = await response.json();

    setCached(cacheKey, data, SEARCH_CACHE_TTL_MS);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to search city' });
  }
});
```

Same shape as the first endpoint — cache check, then WeatherAPI's
`search.json` — this is what powers the dropdown of city suggestions as you
type (the debounce that limits how often this fires lives on the *frontend*;
see [03-FRONTEND.md](./03-FRONTEND.md)).

## Endpoint 3 — the streaming AI insight

This is the most interesting endpoint, because it doesn't just wait for one full
answer and send it back — it streams the AI's response to the browser as it's
generated, word by word:

```javascript
app.post('/weather-insight', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  const { city, temperature, condition, humidity, wind } = req.body;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [ /* a system prompt setting tone + a user prompt with the live weather data */ ],
    temperature: 0.3,
    stream: true,
  });

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    res.write(content);
  }
  res.end();
});
```

- **`Transfer-Encoding: chunked`** tells the browser "I don't know the total
  length of this response yet — I'm going to send it to you in pieces as they
  become available," instead of the normal pattern of "here's the response, all
  at once, and here's exactly how big it is."
- **`stream: true`** on the Groq call is what makes the SDK give you an
  **async iterator** (`for await...of`) instead of waiting for the whole
  response — each `chunk` is a small fragment of the AI's answer as it's being
  generated, exactly like watching ChatGPT type out an answer live.
- **`res.write(content)`** sends each fragment to the browser the instant it
  arrives from Groq, rather than buffering everything and sending it once at the
  end. The frontend then reads these fragments as they arrive and appends them
  to the screen — see `WeatherAiService` in
  [03-FRONTEND.md](./03-FRONTEND.md) for the receiving half of this.
- The **prompt itself** is carefully constrained (max two sentences, no
  clichés like "perfect for outdoor activities," no poetic language) to keep the
  AI's tone consistent with the rest of the app's calm, modern personality
  instead of reading like a generic weather-bot.
- If anything goes wrong (Groq is down, the key is invalid, etc.), the `catch`
  block writes a plain fallback sentence — `'AI insight is currently
  unavailable.'` — instead of the request just failing silently or hanging.
- This endpoint is deliberately **not cached** (every insight is meant to be a
  fresh sentence from live data) but it *is* covered by the same rate limiter
  above.

Next: [03-FRONTEND.md](./03-FRONTEND.md) — the Angular dashboard that consumes
all three of these endpoints.
