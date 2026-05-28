import {
  Component,
  signal,
  computed,
  inject,
  HostListener,
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
  ],

  templateUrl: './weather-dashboard.component.html',

  styleUrl: './weather-dashboard.component.scss',
})
export class WeatherDashboardComponent {
  private readonly weatherService = inject(WeatherService);

  private readonly weatherAiService = inject(WeatherAiService);

  readonly city = signal('Hyderabad');

  readonly temperature = signal('28°C');

  readonly condition = signal('sunny');

  readonly feelsLike = signal('');

  readonly conditionIcon = signal('');

  readonly localTime = signal('');

  readonly latitude = signal(17.385);

  readonly longitude = signal(78.4867);

  readonly isLoading = signal(false);

  readonly isInsightLoading = signal(false);

  readonly streamedInsight = signal('');

  readonly suggestions = signal<CitySuggestion[]>([]);

  readonly forecast = signal<ForecastHour[]>([]);

  readonly dailyForecast = signal<DailyForecast[]>([]);

  readonly stats = signal([
    {
      label: 'Humidity',
      value: '72%',
    },

    {
      label: 'Wind',
      value: '12 km/h',
    },

    {
      label: 'UV Index',
      value: '4',
    },

    {
      label: 'Feels Like',
      value: '31°C',
    },
  ]);

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  cursorX = signal(0);

  cursorY = signal(0);

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

  async searchCity(city: string): Promise<void> {
    try {
      this.isLoading.set(true);

      this.isInsightLoading.set(true);

      const weatherData = await this.weatherService.getWeatherByCity(city);

      /* LOCATION */

      this.latitude.set(weatherData.latitude);

      this.longitude.set(weatherData.longitude);

      /* HERO */

      this.city.set(weatherData.city);

      this.temperature.set(weatherData.temperature);

      this.condition.set(weatherData.condition);

      this.feelsLike.set(weatherData.feelsLike);

      this.conditionIcon.set(weatherData.conditionIcon);

      this.localTime.set(weatherData.localTime);

      /* DATA */

      this.stats.set(weatherData.stats);

      this.forecast.set(weatherData.forecast);

      this.dailyForecast.set(weatherData.dailyForecast);

      /* SEARCH */

      this.suggestions.set([]);

      /* AI */

      this.streamedInsight.set('');

      await this.weatherAiService.generateInsight(
        weatherData,

        (chunk) => {
          this.streamedInsight.update((current) => current + chunk);
        },
      );
    } catch (error) {
      console.error('Weather Search Error:', error);

      this.streamedInsight.set('Unable to fetch weather insight right now.');
    } finally {
      this.isLoading.set(false);

      this.isInsightLoading.set(false);
    }
  }

  searchSuggestions(query: string): void {
    clearTimeout(this.searchDebounceTimer);

    if (!query.trim()) {
      this.suggestions.set([]);

      return;
    }

    this.searchDebounceTimer = setTimeout(async () => {
      const suggestions = await this.weatherService.searchCities(query);

      this.suggestions.set(suggestions);
    }, 400);
  }
}
