# 3. Frontend — The Angular Dashboard

## One page, almost all its state as plain Signals

Unlike a larger app that spreads state across several injectable services, the
entire dashboard's data — city, temperature, condition, forecast, air quality,
wind, the AI insight text, loading flags — lives as individual `signal()`
declarations directly on
[`WeatherDashboardComponent`](../src/app/features/weather/pages/weather-dashboard/weather-dashboard.component.ts):

```typescript
readonly city = signal('');
readonly temperature = signal('');
readonly condition = signal('');
readonly isLoading = signal(false);
readonly dailyForecast = signal<DailyForecast[]>([]);
readonly streamedInsight = signal('');
// ...about thirty more
```

**Why this is a reasonable choice here, not a shortcut:** this app has exactly
one real "screen" — there's no second page that also needs to know the current
temperature, no navigation away and back that needs this state preserved
elsewhere. When state is only ever read by the one component that owns it and
its direct children (the widgets, via `input()`), putting it in a shared
`@Injectable` service adds a layer of indirection without buying anything —
there's nowhere else that would ever inject that service. Signals living
directly on the component that owns the page is the simpler, equally-correct
option in that situation.

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

## Remembering recently searched cities

```typescript
readonly recentCities = signal<string[]>(this.loadRecentCities());

private saveRecentCity(city: string): void {
  const withoutDuplicate = this.recentCities().filter(
    (existing) => existing.toLowerCase() !== city.toLowerCase(),
  );
  const updated = [city, ...withoutDuplicate].slice(0, this.MAX_RECENT_CITIES);
  this.recentCities.set(updated);
  localStorage.setItem(this.RECENT_CITIES_KEY, JSON.stringify(updated));
}
```

There's deliberately no database anywhere in this project (see
[01-ARCHITECTURE.md](./01-ARCHITECTURE.md)), so "remembering" something across
visits has to happen entirely in the browser. `localStorage` is the simplest
tool for that — it's just a small key/value store the browser keeps around
between page loads. Every successful search calls `saveRecentCity` with the
city name *WeatherAPI resolved it to* (not the raw text the user typed), moves
it to the front of the list, drops any older duplicate of the same city, and
caps the list at 5 entries. Both the read (`loadRecentCities`, called once
when the signal is created) and the write are wrapped in `try/catch`, because
`localStorage` can throw in restrictive environments like private browsing —
if that happens, recent cities simply won't persist, which is an acceptable
degradation rather than something worth crashing over.

`WeatherSearchComponent` receives this list as an `input()` and renders it as
a row of clickable chips, but only when the search box is empty and there are
no autocomplete suggestions showing — see
[04-FEATURES.md](./04-FEATURES.md) for the widget's full behavior.

## Hinting when Render's free tier is waking up

```typescript
this.wakeHintTimer = setTimeout(() => {
  this.isWakingBackend.set(true);
}, this.WAKE_HINT_DELAY_MS); // 4000
```

The backend's free hosting tier spins down after inactivity and can take
several seconds to wake back up on the next request (see
[05-DEPLOYMENT.md](./05-DEPLOYMENT.md)). Without any indication of *why* a
search is taking unusually long, that delay just looks like the app is stuck.
`searchCity()` starts a 4-second timer the moment a search begins; if the
request is still in flight when that timer fires, `isWakingBackend` flips to
`true` and the dashboard shows a small explanatory banner. The timer is
cleared in the `finally` block of `searchCity()` regardless of whether the
request succeeded, failed, or finished quickly — so on a normal, fast request
the banner never has a chance to appear at all.

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

## Testing the mapping logic

`WeatherService` (see its `mapHourlyForecast`, `mapDailyForecast`, and
`mapStats` methods) is the trickiest *pure logic* in the frontend — reshaping
WeatherAPI's raw, deeply-nested response into the small typed shapes each
widget actually consumes — so it's the part of the codebase with the most
value in having real automated tests, in
[`weather.service.spec.ts`](../src/app/features/weather/services/weather.service.spec.ts).

The tests use Angular's `HttpTestingController` to intercept the two HTTP
calls `getWeatherByCity()` makes (WeatherAPI itself, then a geocoding lookup)
and feed back canned responses, then assert on the shape that comes out the
other end — including that the hourly forecast filter genuinely drops hours
that have already passed and keeps the ones still ahead.

One non-obvious wrinkle: `getWeatherByCity()` awaits *two* HTTP calls in
sequence. A plain `async`/`await` test can `await` the whole result at the
end, but it can't safely insert a pause **between** flushing the first mocked
request and asserting the second one was made — nothing in the test yields
control back to the JavaScript engine at that exact point, so the second
request may not have fired yet. The tests use Angular's `fakeAsync` +
`tick()` instead, which deterministically flushes pending
promises/microtasks on demand:

```typescript
it('...', fakeAsync(() => {
  let result!: WeatherData;
  service.getWeatherByCity('London').then((r) => (result = r));

  httpMock.expectOne(/* weather request */).flush(mockForecastResponse);
  tick(); // let the service's `await` resume and fire the next request

  httpMock.expectOne(/* geocoding request */).flush(mockCoordinates);
  tick(); // let it resume again and resolve the outer promise

  expect(result.city).toBe('London');
}));
```

Next: [04-FEATURES.md](./04-FEATURES.md) — every widget on the dashboard, in
detail.
