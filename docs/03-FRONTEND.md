# 3. Frontend — The Angular Dashboard

## One page, almost all its state as plain Signals

Unlike a larger app that spreads state across several injectable services, the
entire dashboard's data — city, temperature, condition, forecast, air quality,
wind, the AI insight text, loading flags — lives as ~25 individual `signal()`
declarations directly on
[`WeatherDashboardComponent`](../src/app/features/weather/pages/weather-dashboard/weather-dashboard.component.ts):

```typescript
readonly city = signal('');
readonly temperature = signal('');
readonly condition = signal('');
readonly isLoading = signal(false);
readonly dailyForecast = signal<DailyForecast[]>([]);
readonly streamedInsight = signal('');
// ...about twenty more
```

**Why this is a reasonable choice here, not a shortcut:** this app has exactly
one real "screen" — there's no second page that also needs to know the current
temperature, no navigation away and back that needs this state preserved
elsewhere. When state is only ever read by the one component that owns it and
its direct children (the widgets, via `input()`), putting it in a shared
`@Injectable` service adds a layer of indirection without buying anything —
there's nowhere else that would ever inject that service. Signals living
directly on the component that owns the page is the simpler, equally-correct
option in that situation. (Contrast this with a multi-page app like CareerPilot,
where a `CompaniesService` is shared *because* three different pages need the
same company list — see that project's own frontend blueprint for that pattern.)

Every widget below the dashboard receives its slice of this state as an
Angular `input()` — e.g. `<app-daily-forecast [forecast]="dailyForecast()"
[isLoading]="isLoading()" />` — so each widget stays a small, focused,
"given this data, render it" component with no state of its own to manage.

## `computed()` — deriving the UI from the raw data

Three examples worth knowing, because each shows a different reason to use
`computed()` instead of a plain method:

```typescript
readonly backgroundClass = computed(() => {
  const condition = this.condition().toLowerCase();
  if (condition.includes('thunder') || condition.includes('storm')) return 'storm';
  if (condition.includes('rain') || condition.includes('drizzle')) return 'rainy';
  if (condition.includes('cloud') || condition.includes('mist') || condition.includes('fog')) return 'cloudy';
  if (condition.includes('sun') || condition.includes('clear')) return 'sunny';
  return 'default';
});
```

This picks which animated background (rain effects, storm flashes, etc.) to
show, purely derived from the current condition text — it recalculates
automatically only when `condition` actually changes, and every place in the
template that reads `backgroundClass()` always sees a value consistent with the
current condition, with no risk of it being stale.

```typescript
readonly greeting = computed(() => {
  if (!this.localTime()) return '';
  const hour = new Date(this.localTime()).getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
});
```

Small derived formatting logic like this is exactly what `computed()` is for —
it would be equally correct as a plain method, but a `computed()` only
re-runs when `localTime` changes, rather than on every single change-detection
cycle Angular runs for any reason.

## Loading the dashboard: geolocation first, a real city as fallback

```typescript
private loadInitialWeather(): void {
  if (!navigator.geolocation) {
    this.searchCity('Tenali');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => this.searchCity(`${position.coords.latitude},${position.coords.longitude}`),
    () => this.searchCity('Tenali'),
    { timeout: 10000 },
  );
}
```

Three paths, all handled: the browser doesn't support geolocation at all, the
user denies the permission prompt, or it just times out after 10 seconds — every
one of them falls back to a hardcoded default city rather than leaving the
dashboard blank. WeatherAPI itself accepts a `"lat,lon"` string as a valid `q`
value, so no separate reverse-geocoding step is needed just to turn coordinates
into a request.

## Debounced search suggestions

```typescript
searchSuggestions(query: string): void {
  clearTimeout(this.searchDebounceTimer);
  if (!query.trim()) { this.suggestions.set([]); return; }
  this.searchDebounceTimer = setTimeout(async () => {
    const suggestions = await this.weatherService.searchCities(query);
    this.suggestions.set(suggestions);
  }, 400);
}
```

Without debouncing, typing "London" would fire five separate API requests (one
per keystroke). `clearTimeout` on every call cancels any pending request that
hasn't fired yet, so only the *last* keystroke in a burst of typing actually
triggers a network call, 400ms after the user pauses.

## Consuming the streaming AI insight

[`WeatherAiService`](../src/app/core/services/weather-ai.service.ts) is the
receiving half of the backend's chunked response (see
[02-BACKEND.md](./02-BACKEND.md)):

```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const result = await reader.read();
  if (result.done) break;
  const chunk = decoder.decode(result.value);
  onChunk(chunk);
}
```

`response.body` is a `ReadableStream` of raw bytes; `getReader()` lets you pull
from it piece by piece instead of waiting for the whole response, and
`TextDecoder` turns each raw byte chunk back into text. Each `onChunk` call in
the dashboard component does:

```typescript
this.streamedInsight.update((current) => current + chunk);
```

`.update()` (rather than `.set()`) is the right tool here specifically because
the new value depends on the *previous* value — appending to what's already
there — and every time this signal updates, the AI-insight widget re-renders
with the sentence one fragment longer, producing the live-typing effect on
screen.

## Widgets that need the DOM directly: Leaflet and ApexCharts

Most of this codebase is pure Angular templates, but two widgets wrap
third-party libraries that draw directly onto the page using their own
non-Angular DOM APIs:

- **`WeatherMapComponent`** wraps **Leaflet** (an interactive map library). It
  waits for `ngAfterViewInit` (confirming the DOM element it needs already
  exists) before calling `L.map(...)`, and explicitly calls `map.remove()` in
  `ngOnDestroy` — without that cleanup, Leaflet's map instance and its event
  listeners would leak every time this component is destroyed and recreated
  (e.g. searching a new city while the widget re-renders).
- **`TemperatureChartComponent`** wraps **ApexCharts** via `ng-apexcharts`,
  configuring the chart's series, axes, gradient fill, and tooltip almost
  entirely through `computed()` properties — so the chart's shape updates
  automatically whenever the underlying hourly forecast data changes, with no
  manual "redraw the chart" call needed.

Next: [04-FEATURES.md](./04-FEATURES.md) — every widget on the dashboard, in
detail.
