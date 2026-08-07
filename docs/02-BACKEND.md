# 2. Backend — The Express Server, In Full

The entire backend is one file: [`server/index.js`](../server/index.js). No
framework structure beyond Express itself, no folders of controllers/models —
for three endpoints doing pure proxying, that's an appropriate amount of
structure, not a shortcut.

## The setup

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());
```

- **`dotenv`** loads `server/.env` (`GROQ_API_KEY`, `WEATHER_API_KEY`) into
  `process.env` when running locally. In production on Render, the same
  variable names are set directly in Render's dashboard instead — `dotenv` finds
  nothing to load there, which is fine, since the variables are already present
  in the environment.
- **`cors()`** — without this, the browser would block requests from
  `nimbus-ai-phi.vercel.app` (the frontend's own domain) to
  `nimbus-ai-api.onrender.com` (a *different* domain) as a cross-origin request.
  `cors()` with no options tells Express "allow requests from any origin,"
  appropriate here since this API has no authentication or per-user data to
  protect — it's just a public weather proxy.
- **`express.json()`** — middleware that parses an incoming request's JSON body
  and makes it available as `req.body`. Without it, `req.body` would be
  `undefined` on every POST request.

## Endpoint 1 — the weather forecast proxy

```javascript
// WeatherAPI's free tier caps forecast lookahead at 3 days (was 7 previously).
const FORECAST_DAYS = 3;

app.get('/api/weather', async (req, res) => {
  try {
    const city = req.query.city;
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=${FORECAST_DAYS}&aqi=yes`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch weather data' });
  }
});
```

`req.query.city` reads the `?city=...` part of the URL. The rest is a plain
`fetch` to WeatherAPI's own `forecast.json` endpoint, with the secret key
attached server-side, and the raw JSON handed straight back with `res.json(data)`.

**`FORECAST_DAYS` used to be a hardcoded `days=7`.** WeatherAPI's free tier
changed to only allow 3 days of forecast lookahead, so requesting 7 started
either failing or silently truncating. Pulling it into a single named constant
means the one place this number matters is obvious and easy to bump again later
if the plan ever changes — see [04-FEATURES.md](./04-FEATURES.md) for how the
*frontend* was updated to match (it no longer says "7-Day Forecast" anywhere).

## Endpoint 2 — city search (autocomplete)

```javascript
app.get('/api/weather/search', async (req, res) => {
  const query = req.query.q;
  const response = await fetch(
    `https://api.weatherapi.com/v1/search.json?key=${process.env.WEATHER_API_KEY}&q=${query}`
  );
  const data = await response.json();
  res.json(data);
});
```

Same shape as the first endpoint, calling WeatherAPI's `search.json` instead —
this is what powers the dropdown of city suggestions as you type (the debounce
that limits how often this fires lives on the *frontend*; see
[03-FRONTEND.md](./03-FRONTEND.md)).

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

Next: [03-FRONTEND.md](./03-FRONTEND.md) — the Angular dashboard that consumes
all three of these endpoints.
