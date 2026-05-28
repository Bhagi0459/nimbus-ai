require('dotenv').config();

const express =
    require('express');

const cors =
    require('cors');

const Groq =
    require('groq-sdk');

const app = express();

const groq = new Groq({

    apiKey:
        process.env.GROQ_API_KEY,
});

const PORT =
    process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.get(
    '/',
    (request, response) => {

        response.json({
            message:
                'Nimbus AI backend running',
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

            const prompt = `
You are Nimbus AI,
a modern premium weather assistant.

Generate a short,
natural weather insight.

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

                    model:
                        'llama-3.3-70b-versatile',

                    messages: [

                        {
                            role: 'system',

                            content: `
You are Nimbus AI,
a modern weather assistant.

Your tone should feel:
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

Instead:
briefly describe how the weather feels overall.

Keep responses:
- concise
- conversational
- observational
- maximum 2 short sentences
`,
                        },

                        {
                            role: 'user',

                            content: `
Weather Data:
- City: ${city}
- Temperature: ${temperature}
- Condition: ${condition}
- Humidity: ${humidity}
- Wind: ${wind}

Generate a concise weather insight.
`,
                        },
                    ],

                    temperature: 0.3,

                    stream: true,
                });

            for await (
                const chunk
                of completion
            ) {

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

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );
    }
);