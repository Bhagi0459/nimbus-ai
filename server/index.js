require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Groq = require('groq-sdk');
const app = express();
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const PORT = process.env.PORT || 3000;

// Render (and most PaaS hosts) put the app behind a reverse proxy that sets
// X-Forwarded-For. Without this, express-rate-limit can't safely derive the
// real client IP and throws on every request instead of rate-limiting.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// Public proxy, no auth — this caps how hard any one client can hit our
// WeatherAPI/Groq keys instead of leaving the quota fully open.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

app.use(['/api/', '/weather-insight'], apiLimiter);

// Simple in-memory TTL cache so repeat searches for the same city/query
// don't re-hit WeatherAPI. Fine for a single Node instance with no DB.
const cache = new Map();

function getCached(key) {
    const entry = cache.get(key);

    if (!entry) {
        return null;
    }

    if (Date.now() - entry.expiresAt > 0) {
        cache.delete(key);
        return null;
    }

    return entry.data;
}

function setCached(key, data, ttlMs) {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
}

app.get(
    '/',
    (request, response) => {
        response.json({
            message: 'Nimbus AI backend running',
        });
    }
);

app.post(
    '/weather-insight',

    async (
        request,
        response
    ) => {

        try {

            response.setHeader(
                'Content-Type',
                'text/plain'
            );

            response.setHeader(
                'Transfer-Encoding',
                'chunked'
            );

            const {
                city,
                temperature,
                condition,
                humidity,
                wind,
            } = request.body;

            const prompt = ` You are Nimbus AI, a modern premium weather assistant. Generate a short, natural weather insight.

                Weather Data:
                    - City: ${city}
                    - Temperature: ${temperature}
                    - Condition: ${condition}
                    - Humidity: ${humidity}
                    - Wind: ${wind}

                    Rules:
                    - Maximum 2 short sentences
                    - Sound calm, subtle, and modern
                    - Keep tone observational, not advisory
                    - Avoid recommendations unless necessary
                    - Avoid generic positive conclusions
                    - Avoid phrases like:
                      "perfect for outdoor activities"
                      "pleasant atmosphere"
                      "great weather"
                      "ideal conditions"
                    - Avoid poetic or dramatic wording
                    - Avoid weather reporter tone
                    - Avoid filler sentences
                    - Focus on atmosphere and overall feel
                    - Keep wording concise and premium
                    - Do not use quotation marks
                    `;

            const completion =
                await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `You are Nimbus AI, a modern weather assistant. Your tone should feel:
                                - natural
                                - calm
                                - modern
                                - subtle
                                - human

                                Avoid:
                                - poetic language
                                - dramatic descriptions
                                - generic positivity
                                - robotic summaries
                                - weather reporter style

                            Do not simply repeat raw weather data.
                            Instead: briefly describe how the weather feels overall.
                            Keep responses:
                            - concise
                            - conversational
                            - observational
                            - maximum 2 short sentences
                            `,
                        },
                        {
                            role: 'user',
                            content: ` Weather Data:
                            - City: ${city}
                            - Temperature: ${temperature}
                            - Condition: ${condition}
                            - Humidity: ${humidity}
                            - Wind: ${wind}
                            Generate a concise weather insight.`,
                        },
                    ],
                    temperature: 0.3,
                    stream: true,
                });

            for await (const chunk of completion) {

                const content =

                    chunk.choices[0]?.delta
                        ?.content || '';

                response.write(content);
            }

            response.end();

        } catch (error) {

            console.error(error);

            response.write(

                'AI insight is currently unavailable.'
            );

            response.end();
        }
    }
);

// WeatherAPI's free tier caps forecast lookahead at 3 days (was 7 previously).
const FORECAST_DAYS = 3;

const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000;

app.get('/api/weather', async (req, res) => {
    try {
        const city = req.query.city;
        const cacheKey = `weather:${city}`.toLowerCase();

        const cached = getCached(cacheKey);

        if (cached) {
            return res.json(cached);
        }

        // Old (pre free-tier change) request — kept for reference:
        // const response = await fetch(
        //     `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=7&aqi=yes`
        // );

        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=${FORECAST_DAYS}&aqi=yes`
        );

        const data = await response.json();

        setCached(cacheKey, data, WEATHER_CACHE_TTL_MS);

        res.json(data);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Unable to fetch weather data',
        });
    }
});

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

        res.status(500).json({
            error: 'Unable to search city',
        });
    }
});

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );
    }
);