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

            const {
                city,
                temperature,
                condition,
                humidity,
                wind,
            } = request.body;

            const prompt = `
You are Nimbus AI,
a premium weather assistant.

Generate a short,
modern weather insight
for the following data.

City: ${city}
Temperature: ${temperature}
Condition: ${condition}
Humidity: ${humidity}
Wind: ${wind}

Keep response:
- concise
- premium sounding
- human friendly
- under 35 words
`;

            const completion =

                await groq.chat.completions.create({

                    model:
                        'llama3-8b-8192',

                    messages: [

                        {
                            role: 'user',

                            content: prompt,
                        },
                    ],

                    temperature: 0.7,
                });

            const insight =

                completion
                    .choices[0]
                    .message
                    .content;

            response.json({

                insight,
            });

        } catch (error) {

            console.error(error);

            response.status(500).json({

                error:
                    'Failed to generate insight',
            });
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