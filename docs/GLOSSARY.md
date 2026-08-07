# Glossary

**API proxy** — A backend whose job is to sit between the browser and a
third-party API, attaching a secret key server-side so the browser never sees
it. This project's entire Express backend is one. See
[02-BACKEND.md](./02-BACKEND.md).

**`computed()`** — An Angular Signal whose value is automatically derived from
other Signals and recalculates only when one it depends on actually changes. See
[03-FRONTEND.md](./03-FRONTEND.md).

**Debounce** — Delaying an action until a burst of rapid events (like keystrokes)
has paused, so one action fires instead of one per event. Used for the city
search suggestions. See [03-FRONTEND.md](./03-FRONTEND.md).

**Groq** — A third-party AI inference provider; this project uses it to
generate the short natural-language weather "insight" sentence.

**Middleware (Express)** — A function that runs on every incoming request
before it reaches a specific route, such as `cors()` or `express.json()`. See
[02-BACKEND.md](./02-BACKEND.md).

**`ReadableStream` / streaming response** — An HTTP response sent to the browser
in pieces as they become available, rather than all at once. Powers the
live-typing AI insight. See [02-BACKEND.md](./02-BACKEND.md) and
[03-FRONTEND.md](./03-FRONTEND.md).

**Signal (Angular)** — A wrapper around a value that automatically notifies
anything reading it whenever the value changes. See
[03-FRONTEND.md](./03-FRONTEND.md).

**Standalone component (Angular)** — A component that declares its own
dependencies directly (`imports: [...]`) instead of belonging to a shared
`NgModule`. Used throughout this project.

**Transfer-Encoding: chunked** — An HTTP header meaning "the response is being
sent in pieces of unknown total length," rather than one complete body with a
known size. See [02-BACKEND.md](./02-BACKEND.md).
