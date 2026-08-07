import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { WeatherService } from './weather.service';
import { WeatherData } from '../models/weather.model';
import { environment } from '../../../../environments/environment';

/**
 * WeatherAPI returns hour.time as a space-separated local timestamp
 * ("2024-01-01 09:00"), which is what mapHourlyForecast parses via `new
 * Date(hour.time)`. Building these relative to the real clock (rather than
 * mocking Date, which zone.js's timer patching fights with in this project)
 * keeps the past/future split deterministic without fake timers.
 */
function toWeatherApiTime(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  const now = new Date();
  const twoHoursAgo = toWeatherApiTime(new Date(now.getTime() - 2 * 60 * 60 * 1000));
  const oneHourAgo = toWeatherApiTime(new Date(now.getTime() - 60 * 60 * 1000));
  const oneHourAhead = toWeatherApiTime(new Date(now.getTime() + 60 * 60 * 1000));
  const twoHoursAhead = toWeatherApiTime(new Date(now.getTime() + 2 * 60 * 60 * 1000));

  const mockForecastResponse = {
    location: {
      name: 'London',
      lat: 51.5074,
      lon: -0.1278,
      localtime: toWeatherApiTime(now),
    },
    current: {
      temp_c: 15,
      feelslike_c: 13,
      condition: { text: 'Partly cloudy', icon: '//cdn.weatherapi.com/64x64/day/116.png' },
      humidity: 60,
      wind_kph: 10,
      wind_degree: 200,
      wind_dir: 'SW',
      pressure_mb: 1015,
      vis_km: 10,
      uv: 3,
      gust_kph: 18,
      cloud: 40,
      dewpoint_c: 8,
      air_quality: { 'us-epa-index': 2, pm2_5: 8.4, pm10: 12.1 },
    },
    forecast: {
      forecastday: [
        {
          date: '2024-01-01',
          day: {
            maxtemp_c: 18,
            mintemp_c: 9,
            condition: { text: 'Partly cloudy', icon: '//cdn.weatherapi.com/64x64/day/116.png' },
            daily_chance_of_rain: 20,
          },
          astro: { sunrise: '08:00 AM', sunset: '04:30 PM' },
          hour: [
            { time: twoHoursAgo, temp_c: 12, condition: { icon: '//x/1.png' } },
            { time: oneHourAgo, temp_c: 14, condition: { icon: '//x/2.png' } },
            { time: oneHourAhead, temp_c: 15, condition: { icon: '//x/3.png' } },
            { time: twoHoursAhead, temp_c: 16, condition: { icon: '//x/4.png' } },
          ],
        },
        {
          date: '2024-01-02',
          day: {
            maxtemp_c: 17,
            mintemp_c: 8,
            condition: { text: 'Sunny', icon: '//x/5.png' },
            daily_chance_of_rain: 5,
          },
          astro: { sunrise: '08:01 AM', sunset: '04:31 PM' },
          hour: [],
        },
      ],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getWeatherByCity', () => {
    /**
     * getWeatherByCity awaits two sequential HTTP calls (weather, then
     * geocoding). fakeAsync + tick() deterministically flushes the
     * microtasks between them — a plain `await` in the test body can't,
     * since nothing yields control back to the test between the two
     * `httpMock.expectOne` calls.
     */
    it("maps a WeatherAPI response into the app's WeatherData shape", fakeAsync(() => {
      let result!: WeatherData;
      service.getWeatherByCity('London').then((r) => (result = r));

      const weatherReq = httpMock.expectOne(
        (req) => req.url === environment.weatherApiUrl,
      );
      weatherReq.flush(mockForecastResponse);
      tick();

      const geocodeReq = httpMock.expectOne((req) =>
        req.url.includes('nominatim.openstreetmap.org'),
      );
      geocodeReq.flush([{ lat: '51.5074', lon: '-0.1278' }]);
      tick();

      expect(result.city).toBe('London');
      expect(result.temperature).toBe('15°C');
      expect(result.feelsLike).toBe('13°C');
      expect(result.condition).toBe('Partly cloudy');
      expect(result.conditionIcon).toBe('https://cdn.weatherapi.com/64x64/day/116.png');
      expect(result.maxTemp).toBe('18°C');
      expect(result.minTemp).toBe('9°C');
      expect(result.sunrise).toBe('08:00 AM');
      expect(result.sunset).toBe('04:30 PM');
      expect(result.windSpeed).toBe(10);
      expect(result.windDegree).toBe(200);
      expect(result.windDirection).toBe('SW');
      expect(result.airQuality).toEqual({ epaIndex: 2, pm25: 8.4, pm10: 12.1 });

      // Coordinates should come from the geocoding lookup, not WeatherAPI's own lat/lon.
      expect(result.latitude).toBe(51.5074);
      expect(result.longitude).toBe(-0.1278);
    }));

    it('only includes hourly forecast entries later than the current time', fakeAsync(() => {
      let result!: WeatherData;
      service.getWeatherByCity('London').then((r) => (result = r));

      httpMock.expectOne((req) => req.url === environment.weatherApiUrl).flush(mockForecastResponse);
      tick();
      httpMock
        .expectOne((req) => req.url.includes('nominatim.openstreetmap.org'))
        .flush([{ lat: '51.5074', lon: '-0.1278' }]);
      tick();

      // The two past hours (12°C, 14°C) must be dropped, leaving only the
      // two hours that are actually still ahead.
      expect(result.forecast.length).toBe(2);
      expect(result.forecast[0].temperature).toBe('15°C');
      expect(result.forecast[1].temperature).toBe('16°C');
    }));

    it('maps every forecast day and includes all eight stat tiles', fakeAsync(() => {
      let result!: WeatherData;
      service.getWeatherByCity('London').then((r) => (result = r));

      httpMock.expectOne((req) => req.url === environment.weatherApiUrl).flush(mockForecastResponse);
      tick();
      httpMock
        .expectOne((req) => req.url.includes('nominatim.openstreetmap.org'))
        .flush([{ lat: '51.5074', lon: '-0.1278' }]);
      tick();

      expect(result.dailyForecast.length).toBe(2);
      expect(result.dailyForecast[0]).toEqual(
        jasmine.objectContaining({
          condition: 'Partly cloudy',
          maxTemp: '18°C',
          minTemp: '9°C',
          rainChance: '20%',
        }),
      );

      expect(result.stats.map((stat) => stat.label)).toEqual([
        'Humidity',
        'Wind',
        'Pressure',
        'Visibility',
        'UV Index',
        'Wind Gust',
        'Cloud Cover',
        'Dew Point',
      ]);
    }));

    it("falls back to WeatherAPI's own coordinates when geocoding finds nothing", fakeAsync(() => {
      let result!: WeatherData;
      service.getWeatherByCity('London').then((r) => (result = r));

      httpMock.expectOne((req) => req.url === environment.weatherApiUrl).flush(mockForecastResponse);
      tick();
      httpMock
        .expectOne((req) => req.url.includes('nominatim.openstreetmap.org'))
        .flush([]);
      tick();

      expect(result.latitude).toBe(51.5074);
      expect(result.longitude).toBe(-0.1278);
    }));
  });

  describe('searchCities', () => {
    it('maps WeatherAPI search results into CitySuggestion objects', async () => {
      const resultPromise = service.searchCities('Lon');

      const req = httpMock.expectOne(
        (r) => r.url === environment.weatherSearchApiUrl,
      );
      req.flush([
        { id: 1, name: 'London', region: 'City of London', country: 'United Kingdom' },
        { id: 2, name: 'Londonderry', region: 'Derry', country: 'United Kingdom' },
      ]);

      const result = await resultPromise;

      expect(result).toEqual([
        { id: 1, name: 'London', region: 'City of London', country: 'United Kingdom' },
        { id: 2, name: 'Londonderry', region: 'Derry', country: 'United Kingdom' },
      ]);
    });

    it('returns an empty array without making a request for a blank query', async () => {
      const result = await service.searchCities('   ');

      expect(result).toEqual([]);
      httpMock.expectNone((req) => req.url === environment.weatherSearchApiUrl);
    });
  });
});
