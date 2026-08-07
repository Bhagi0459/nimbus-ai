import {
  Component,
  signal,
  computed,
  inject,
  HostListener,
  OnInit,
} from '@angular/core';

import { NgClass } from '@angular/common';

import { WeatherHeroComponent } from '../../widgets/weather-hero/weather-hero.component';
import { StatCardComponent } from '../../widgets/stat-card/stat-card.component';
import { WeatherSearchComponent } from '../../widgets/weather-search/weather-search.component';
import { ForecastTimelineComponent } from '../../widgets/forecast-timeline/forecast-timeline.component';
import { WeatherInsightComponent } from '../../widgets/weather-insight/weather-insight.component';
import { TemperatureChartComponent } from '../../widgets/temperature-chart/temperature-chart.component';
import { WeatherMapComponent } from '../../widgets/weather-map/weather-map.component';
import { DailyForecastComponent } from '../../widgets/daily-forecast/daily-forecast.component';

import { WeatherService } from '../../services/weather.service';
import { WeatherAiService } from '../../../../core/services/weather-ai.service';

import { CitySuggestion } from '../../models/city-suggestion.model';
import { ForecastHour } from '../../models/forecast-hour.model';
import { DailyForecast } from '../../models/daily-forecast.model';
import { AirQuality } from '../../models/air-quality.model';
import { AirQualityComponent } from '../../widgets/air-quality/air-quality.component';
import { WindCompassComponent } from '../../widgets/wind-compass/wind-compass.component';

@Component({
  selector: 'app-weather-dashboard',

  standalone: true,

  imports: [
    WeatherHeroComponent,
    WeatherSearchComponent,
    StatCardComponent,
    ForecastTimelineComponent,
    WeatherInsightComponent,
    TemperatureChartComponent,
    WeatherMapComponent,
    DailyForecastComponent,
    NgClass,
    AirQualityComponent,
    WindCompassComponent,
  ],

  templateUrl: './weather-dashboard.component.html',

  styleUrl: './weather-dashboard.component.scss',
})
export class WeatherDashboardComponent implements OnInit {
  private readonly weatherService = inject(WeatherService);

  private readonly weatherAiService = inject(WeatherAiService);

  readonly city = signal('');

  readonly temperature = signal('');

  readonly condition = signal('');

  readonly feelsLike = signal('');

  readonly conditionIcon = signal('');

  readonly localTime = signal('');

  readonly latitude = signal(16.24);

  readonly longitude = signal(80.64);

  readonly isLoading = signal(false);

  readonly isInsightLoading = signal(false);

  readonly streamedInsight = signal('');

  readonly suggestions = signal<CitySuggestion[]>([]);

  readonly forecast = signal<ForecastHour[]>([]);

  readonly dailyForecast = signal<DailyForecast[]>([]);

  readonly maxTemp = signal('');

  readonly minTemp = signal('');

  readonly sunrise = signal('');

  readonly sunset = signal('');

  readonly stats = signal<
    {
      icon: string;
      label: string;
      value: string;
    }[]
  >([]);

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  readonly cursorX = signal(0);

  readonly cursorY = signal(0);

  readonly windSpeed = signal(0);

  readonly windDegree = signal(0);

  readonly windDirection = signal('');

  private readonly RECENT_CITIES_KEY = 'nimbus-recent-cities';

  private readonly MAX_RECENT_CITIES = 5;

  readonly recentCities = signal<string[]>(this.loadRecentCities());

  /* Render's free tier spins the backend down after inactivity — a cold
   * request can take several seconds, which otherwise just looks stuck. */
  private readonly WAKE_HINT_DELAY_MS = 4000;

  private wakeHintTimer?: ReturnType<typeof setTimeout>;

  readonly isWakingBackend = signal(false);

  ngOnInit(): void {
    // this.searchCity('Tenali');
    this.loadInitialWeather();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const glow = document.querySelector('.cursor-glow') as HTMLElement;

    if (!glow) {
      return;
    }

    glow.style.left = `${event.clientX}px`;

    glow.style.top = `${event.clientY}px`;
  }

  readonly backgroundClass = computed(() => {
    const condition = this.condition().toLowerCase();

    if (condition.includes('thunder') || condition.includes('storm')) {
      return 'storm';
    }

    if (condition.includes('rain') || condition.includes('drizzle')) {
      return 'rainy';
    }

    if (
      condition.includes('cloud') ||
      condition.includes('mist') ||
      condition.includes('fog')
    ) {
      return 'cloudy';
    }

    if (condition.includes('sun') || condition.includes('clear')) {
      return 'sunny';
    }

    return 'default';
  });

  readonly greeting = computed(() => {
    if (!this.localTime()) {
      return '';
    }

    const date = new Date(this.localTime());

    const hour = date.getHours();

    if (hour < 12) {
      return 'Good Morning';
    }

    if (hour < 18) {
      return 'Good Afternoon';
    }

    return 'Good Evening';
  });

  readonly formattedLocalTime = computed(() => {
    if (!this.localTime()) {
      return '';
    }

    const date = new Date(this.localTime());

    return date.toLocaleString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });

  private loadInitialWeather(): void {
    if (!navigator.geolocation) {
      this.searchCity('Tenali');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;

        const longitude = position.coords.longitude;

        this.searchCity(`${latitude},${longitude}`);
      },

      () => {
        this.searchCity('Tenali');
      },

      {
        timeout: 10000,
      },
    );
  }

  async searchCity(city: string): Promise<void> {
    try {
      this.isLoading.set(true);

      this.isInsightLoading.set(true);

      this.isWakingBackend.set(false);

      clearTimeout(this.wakeHintTimer);

      this.wakeHintTimer = setTimeout(() => {
        this.isWakingBackend.set(true);
      }, this.WAKE_HINT_DELAY_MS);

      /* CLEAR OLD DATA */

      this.forecast.set([]);

      this.dailyForecast.set([]);

      this.stats.set([]);

      this.suggestions.set([]);

      this.streamedInsight.set('');

      const weatherData = await this.weatherService.getWeatherByCity(city);

      /* LOCATION */

      this.latitude.set(weatherData.latitude);

      this.longitude.set(weatherData.longitude);

      /* HERO */

      this.city.set(weatherData.city);

      this.saveRecentCity(weatherData.city);

      this.temperature.set(weatherData.temperature);

      this.condition.set(weatherData.condition);

      this.feelsLike.set(weatherData.feelsLike);

      this.conditionIcon.set(weatherData.conditionIcon);

      this.localTime.set(weatherData.localTime);

      /* DATA */

      this.stats.set(weatherData.stats);

      this.forecast.set(weatherData.forecast);

      this.dailyForecast.set(weatherData.dailyForecast);
      this.airQuality.set(weatherData.airQuality);

      this.maxTemp.set(weatherData.maxTemp);

      this.minTemp.set(weatherData.minTemp);
      this.sunrise.set(weatherData.sunrise);

      this.sunset.set(weatherData.sunset);

      this.windSpeed.set(weatherData.windSpeed);

      this.windDegree.set(weatherData.windDegree);

      this.windDirection.set(weatherData.windDirection);

      /* AI */

      this.weatherAiService
        .generateInsight(weatherData, (chunk) => {
          this.streamedInsight.update((current) => current + chunk);
        })
        .then(() => {
          this.isInsightLoading.set(false);
        })
        .catch(() => {
          this.streamedInsight.set(
            'Unable to fetch weather insight right now.',
          );

          this.isInsightLoading.set(false);
        });
    } catch (error) {
      console.error('Weather Search Error:', error);

      this.streamedInsight.set('Unable to fetch weather insight right now.');

      this.isInsightLoading.set(false);
    } finally {
      this.isLoading.set(false);

      clearTimeout(this.wakeHintTimer);

      this.isWakingBackend.set(false);
    }
  }

  private loadRecentCities(): string[] {
    try {
      const stored = localStorage.getItem(this.RECENT_CITIES_KEY);

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveRecentCity(city: string): void {
    const withoutDuplicate = this.recentCities().filter(
      (existing) => existing.toLowerCase() !== city.toLowerCase(),
    );

    const updated = [city, ...withoutDuplicate].slice(
      0,
      this.MAX_RECENT_CITIES,
    );

    this.recentCities.set(updated);

    try {
      localStorage.setItem(this.RECENT_CITIES_KEY, JSON.stringify(updated));
    } catch {
      /* localStorage unavailable (e.g. private browsing) — recent cities
       * just won't persist across reloads, nothing else depends on it. */
    }
  }

  searchSuggestions(query: string): void {
    clearTimeout(this.searchDebounceTimer);

    if (!query.trim()) {
      this.suggestions.set([]);

      return;
    }

    this.searchDebounceTimer = setTimeout(async () => {
      try {
        const suggestions = await this.weatherService.searchCities(query);

        this.suggestions.set(suggestions);
      } catch (error) {
        console.error('City Search Error:', error);

        this.suggestions.set([]);
      }
    }, 400);
  }

  readonly airQuality = signal<AirQuality>({
    epaIndex: 0,

    pm25: 0,

    pm10: 0,
  });

  readonly rainDrops = Array.from({ length: 120 }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 1 + Math.random(),
  }));
}
