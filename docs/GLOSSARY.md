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

**`fakeAsync` / `tick()`** — Angular testing utilities that let a test control
time and pending promises deterministically, instead of relying on real
delays. `tick()` forces any pending microtasks (like an unresolved `await`) to
run immediately. Used to test code that awaits two HTTP calls in sequence. See
[03-FRONTEND.md](./03-FRONTEND.md).

**Groq** — A third-party AI inference provider; this project uses it to
generate the short natural-language weather "insight" sentence.

**`HttpTestingController`** — Angular's tool for intercepting HTTP requests
made during a test and responding with fake data instead of hitting a real
network, via `httpMock.expectOne(...).flush(...)`. See
[03-FRONTEND.md](./03-FRONTEND.md).

**`localStorage`** — A small key/value store the browser keeps on the
visitor's device, persisting between page reloads and visits (until cleared).
Used to remember the last few searched cities without needing a database. See
[03-FRONTEND.md](./03-FRONTEND.md).

**Middleware (Express)** — A function that runs on every incoming request
before it reaches a specific route, such as `cors()` or the rate limiter. See
[02-BACKEND.md](./02-BACKEND.md).

**Rate limiting** — Capping how many requests a single client can make in a
given time window, to stop one visitor (accidentally or on purpose) from
using up a shared, limited resource — here, the WeatherAPI/Groq quotas. See
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

**`trust proxy` / `X-Forwarded-For`** — When an app runs behind a reverse
proxy (as it does on Render), the proxy adds an `X-Forwarded-For` header
carrying the visitor's real IP address. Express ignores that header by
default, since a client could fake it — `app.set('trust proxy', 1)` tells
Express "the first proxy hop is legitimate, trust its value," which rate
limiting needs in order to key correctly by client. See
[02-BACKEND.md](./02-BACKEND.md) and [05-DEPLOYMENT.md](./05-DEPLOYMENT.md).

**TTL (time-to-live) cache** — A cache where each stored entry remembers when
it should expire; once that time passes, the entry is treated as gone and
re-fetched fresh. Used for both the weather and city-search responses. See
[02-BACKEND.md](./02-BACKEND.md).
