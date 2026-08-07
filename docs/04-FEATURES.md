# 4. Features — Every Widget, and Why It's Built That Way

Every widget below follows the same shape: a small, standalone Angular
component that takes its data purely through `input()`s from
`WeatherDashboardComponent` (see [03-FRONTEND.md](./03-FRONTEND.md)) and has no
state of its own beyond how to *display* what it's given.

## Weather Hero

**File:** `widgets/weather-hero`. The big headline block — city name, current
temperature, condition icon, "feels like," and the time-of-day greeting
(`Good Morning` / `Good Afternoon` / `Good Evening`) computed from the location's
own local time, not the visitor's device time — so searching a city on the
other side of the world shows a greeting that actually matches *that* city's
time of day.

## Weather Search

**File:** `widgets/weather-search`. A text input plus a dropdown of live city
suggestions. It emits two separate outputs: `searchInputChange` (fired on every
keystroke, driving the debounced suggestions lookup — see
[03-FRONTEND.md](./03-FRONTEND.md)) and `search` (fired only when the user
actually presses Enter or clicks a suggestion), keeping "show suggestions
as-you-type" and "actually perform a full weather search" as two clearly
separate actions.

When the input is empty and there's no suggestions dropdown open, it also
shows a row of small chips for the last few cities that were searched
(see "Remembering recently searched cities" in
[03-FRONTEND.md](./03-FRONTEND.md)) — clicking one re-runs that search
instantly, the same as clicking an autocomplete suggestion.

## Stat Card

**File:** `widgets/stat-card`. Renders the row of small stat tiles — Humidity,
Wind, Pressure, Visibility, UV Index, Wind Gust, Cloud Cover, Dew Point — built
from the generic `{ icon, label, value }[]` array the dashboard assembles in
`WeatherService.mapStats()`. Because the shape is generic, adding an eighth or
ninth stat later is just adding one more object to that array — no new
component needed.

## Forecast Timeline (hourly)

**File:** `widgets/forecast-timeline`. The scrollable row of upcoming hours for
*today*. Fed directly from `WeatherService.mapHourlyForecast()`, which
deliberately filters out hours that have already passed:

```typescript
.filter((hour: any) => new Date(hour.time).getTime() > Date.now())
```

so the timeline always starts from "now," never showing hours from earlier
today that have already gone by. This filtering logic is covered by an
automated test — see "Testing the mapping logic" in
[03-FRONTEND.md](./03-FRONTEND.md).

## Daily Forecast

**File:** `widgets/daily-forecast`. WeatherAPI's free tier caps forecast
lookahead at 3 days, so both sides of this widget were built to match rather
than hardcode a number that could silently go stale: the backend requests
`days=3` (see the `FORECAST_DAYS` constant in
[02-BACKEND.md](./02-BACKEND.md)), and the heading reads
`{{ forecast().length || 3 }}-Day Forecast`, deriving the number directly from
how many days actually came back. The loading-skeleton placeholder shows the
same number of rows as the real data, so the layout doesn't visibly shrink
once it loads.

## Temperature Chart

**File:** `widgets/temperature-chart`. An area chart (via ApexCharts) of the
day's hourly temperatures, with a soft gradient fill and a smoothed curve. The
Y-axis range is computed from the actual min/max of the current data
(`min - 2` to `max + 2`) rather than a fixed scale, so the chart's shape reads
clearly whether the day ranges from 15–20°C or 28–40°C.

## Weather Map

**File:** `widgets/weather-map`. An interactive Leaflet map centered on the
searched city's coordinates, styled with a dark CARTO tile layer to match the
app's overall dark theme, with a custom glowing marker instead of Leaflet's
default pin. See [03-FRONTEND.md](./03-FRONTEND.md) for the lifecycle details
(`ngAfterViewInit` / `ngOnDestroy`) this widget needs that pure-Angular widgets
don't.

## Wind Compass

**File:** `widgets/wind-compass`. Shows wind speed and a compass needle rotated
to `windDegree`. `windDirection` from the API arrives as a short code (`NNE`,
`SW`, ...); a lookup table expands it to a full readable label
("North-Northeast", "Southwest") for the on-screen text, while the shorter code
form is what actually drives the needle's rotation angle.

## Air Quality

**File:** `widgets/air-quality`. WeatherAPI's `air_quality['us-epa-index']` is a
number from 1–6; this widget maps it to both a human label ("Good," "Moderate,"
..."Very Unhealthy") and a CSS class controlling its color, so the same number
that drives the text also drives the visual severity color — they can never
disagree.

## Weather Insight (AI)

**File:** `widgets/weather-insight`. Displays the streamed sentence from
`WeatherAiService` as it arrives (see [03-FRONTEND.md](./03-FRONTEND.md)) along
with its own loading state while the first fragment is still in flight from
Groq.

## Dynamic backgrounds and rain

The dashboard's root component computes a `backgroundClass` (`storm` / `rainy` /
`cloudy` / `sunny` / `default`) from the current condition text (see
[03-FRONTEND.md](./03-FRONTEND.md)) and switches the whole page's animated
background accordingly. The rain effect itself is generated once per component
instance as 120 individually-randomized drop elements:

```typescript
readonly rainDrops = Array.from({ length: 120 }, (_, index) => ({
  id: index,
  left: Math.random() * 100,
  delay: Math.random() * 2,
  duration: 1 + Math.random(),
}));
```

Randomizing each drop's horizontal position, animation delay, and fall duration
individually is what keeps 120 identical CSS animations from looking like an
obviously repeating pattern.

## "Waking up the server" banner

A small banner that appears above the search bar only when a search is taking
longer than 4 seconds — see "Hinting when Render's free tier is waking up" in
[03-FRONTEND.md](./03-FRONTEND.md) for exactly how it's triggered. It exists
purely to explain an otherwise-confusing delay: without it, the free-tier
backend's cold-start pause (see [05-DEPLOYMENT.md](./05-DEPLOYMENT.md)) looks
indistinguishable from the app being broken.

## Skeleton loaders

Every widget accepts an `isLoading` input and renders a skeleton (pulsing
placeholder shapes matching its real layout) while true, matching a common
pattern for "the layout doesn't jump once real data replaces the placeholder."

## Favicon

`public/favicon.svg` is a small, hand-authored cloud icon (a layered blue
cloud with a subtle sparkle accent, on the same dark navy used as the
dashboard's own background) referenced as the primary icon in
`src/index.html`, with a matching `favicon.ico` kept as a fallback for the
rare browser that doesn't support SVG favicons.

Next: [05-DEPLOYMENT.md](./05-DEPLOYMENT.md) — Vercel, Render, and GitHub
Actions.
