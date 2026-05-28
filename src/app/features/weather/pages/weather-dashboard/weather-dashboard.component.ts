import {
  Component,
  signal,
  computed,
  inject,
  HostListener,
} from '@angular/core';

import { WeatherHeroComponent } from '../../widgets/weather-hero/weather-hero.component';
import { StatCardComponent } from '../../widgets/stat-card/stat-card.component';
import { WeatherSearchComponent } from '../../widgets/weather-search/weather-search.component';
import { WeatherService } from '../../services/weather.service';
import { CitySuggestion } from '../../models/city-suggestion.model';
import { ForecastHour } from '../../models/forecast-hour.model';
import { ForecastTimelineComponent } from '../../widgets/forecast-timeline/forecast-timeline.component';
import { WeatherData } from '../../models/weather.model';
import { WeatherInsightComponent } from '../../widgets/weather-insight/weather-insight.component';
import { WeatherAiService } from '../../../../core/services/weather-ai.service';
import { TemperatureChartComponent } from '../../widgets/temperature-chart/temperature-chart.component';
import { WeatherMapComponent } from '../../widgets/weather-map/weather-map.component';
import { NgClass } from '@angular/common';
import { DailyForecast } from '../../models/daily-forecast.model';
import { DailyForecastComponent } from '../../widgets/daily-forecast/daily-forecast.component';

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
    NgClass,
    DailyForecastComponent,
  ],
  templateUrl: './weather-dashboard.component.html',
  styleUrl: './weather-dashboard.component.scss',
})
export class WeatherDashboardComponent {
  readonly city = signal('Hyderabad');

  readonly temperature = signal('28°C');

  readonly condition = signal('sunny');
  private readonly weatherService = inject(WeatherService);

  readonly isLoading = signal(false);

  readonly feelsLike = signal('');

  readonly conditionIcon = signal('');

  readonly localTime = signal('');
  readonly latitude = signal(17.385);
  readonly longitude = signal(78.4867);

  readonly suggestions = signal<CitySuggestion[]>([]);

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  readonly forecast = signal<ForecastHour[]>([]);

  readonly streamedInsight = signal('');

  readonly isInsightLoading = signal(false);
  private readonly weatherAiService = inject(WeatherAiService);

  readonly dailyForecast = signal<DailyForecast[]>([]);

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

  readonly backgroundClass = computed(() => {
    const condition = this.condition().toLowerCase();

    if (condition.includes('thunder') || condition.includes('storm')) {
      return 'storm';
    }

    if (
      condition.includes('rain') ||
      condition.includes('drizzle')
      // ||condition.includes('thunder')
    ) {
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

  async searchCity(city: string): Promise<void> {
    this.isLoading.set(true);
    this.isInsightLoading.set(true);
    const weatherData = await this.weatherService.getWeatherByCity(city);

    this.latitude.set(weatherData.latitude);
    this.longitude.set(weatherData.longitude);

    this.city.set(weatherData.city);

    this.temperature.set(weatherData.temperature);

    this.condition.set(weatherData.condition);

    this.stats.set(weatherData.stats);

    this.feelsLike.set(weatherData.feelsLike);

    this.conditionIcon.set(weatherData.conditionIcon);

    this.localTime.set(weatherData.localTime);

    this.suggestions.set([]);

    this.forecast.set(weatherData.forecast);

    const insightResponse = this.streamedInsight.set('');

    this.dailyForecast.set(weatherData.dailyForecast);

    try {
      this.streamedInsight.set('');

      await this.weatherAiService.generateInsight(
        weatherData,

        (chunk) => {
          this.streamedInsight.update((current) => current + chunk);
        },
      );
    } catch (error) {
      console.error(error);

      this.streamedInsight.set('AI insight is temporarily unavailable.');
    }

    this.isInsightLoading.set(false);

    this.isInsightLoading.set(false);

    this.isInsightLoading.set(false);

    this.isLoading.set(false);
  }

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

  // private generateInsight(weatherData: WeatherData): string {
  //   const condition = weatherData.condition.toLowerCase();

  //   const temperature = Number.parseFloat(weatherData.temperature);

  //   const humidity = Number.parseFloat(
  //     weatherData.stats.find((stat) => stat.label === 'Humidity')?.value || '0',
  //   );

  //   if (condition.includes('rain')) {
  //     return `
  //     Rainy conditions expected.
  //     Carry an umbrella and
  //     expect slower commutes.
  //   `;
  //   }

  //   if (temperature >= 35) {
  //     return `
  //     High temperatures detected.
  //     Stay hydrated and avoid
  //     prolonged afternoon exposure.
  //   `;
  //   }

  //   if (humidity >= 75) {
  //     return `
  //     Humidity levels are elevated.
  //     It may feel warmer than
  //     the reported temperature.
  //   `;
  //   }

  //   if (condition.includes('cloud')) {
  //     return `
  //     Cloud cover may create
  //     cooler and softer daylight
  //     conditions through the day.
  //   `;
  //   }

  //   return `
  //   Weather conditions look stable.
  //   Great time for outdoor plans
  //   and light travel activity.
  // `;
  // }

  private async streamInsight(text: string): Promise<void> {
    this.streamedInsight.set('');

    for (let index = 0; index < text.length; index++) {
      this.streamedInsight.update((current) => current + text[index]);

      await new Promise((resolve) => setTimeout(resolve, 18));
    }
  }
}
