import { Component, signal, computed, inject } from '@angular/core';

import { WeatherHeroComponent } from '../../widgets/weather-hero/weather-hero.component';
import { StatCardComponent } from '../../widgets/stat-card/stat-card.component';
import { WeatherSearchComponent } from '../../widgets/weather-search/weather-search.component';
import { WeatherService } from '../../services/weather.service';
import { CitySuggestion } from '../../models/city-suggestion.model';
import { ForecastHour } from '../../models/forecast-hour.model';
import { ForecastTimelineComponent } from '../../widgets/forecast-timeline/forecast-timeline.component';
import { WeatherData } from '../../models/weather.model';
import { WeatherInsightComponent } from '../../widgets/weather-insight/weather-insight.component';

@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  imports: [
    WeatherHeroComponent,
    WeatherSearchComponent,
    StatCardComponent,
    ForecastTimelineComponent,
    WeatherInsightComponent,
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

  readonly suggestions = signal<CitySuggestion[]>([]);

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  readonly forecast = signal<ForecastHour[]>([]);

  readonly insight = signal('');

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

    if (
      condition.includes('rain') ||
      condition.includes('drizzle') ||
      condition.includes('thunder')
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

    const weatherData = await this.weatherService.getWeatherByCity(city);

    this.city.set(weatherData.city);

    this.temperature.set(weatherData.temperature);

    this.condition.set(weatherData.condition);

    this.stats.set(weatherData.stats);

    this.feelsLike.set(weatherData.feelsLike);

    this.conditionIcon.set(weatherData.conditionIcon);

    this.localTime.set(weatherData.localTime);

    this.suggestions.set([]);

    this.forecast.set(weatherData.forecast);

    this.insight.set(this.generateInsight(weatherData));

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

  private generateInsight(weatherData: WeatherData): string {
    const condition = weatherData.condition.toLowerCase();

    const temperature = Number.parseFloat(weatherData.temperature);

    const humidity = Number.parseFloat(
      weatherData.stats.find((stat) => stat.label === 'Humidity')?.value || '0',
    );

    if (condition.includes('rain')) {
      return `
      Rainy conditions expected.
      Carry an umbrella and
      expect slower commutes.
    `;
    }

    if (temperature >= 35) {
      return `
      High temperatures detected.
      Stay hydrated and avoid
      prolonged afternoon exposure.
    `;
    }

    if (humidity >= 75) {
      return `
      Humidity levels are elevated.
      It may feel warmer than
      the reported temperature.
    `;
    }

    if (condition.includes('cloud')) {
      return `
      Cloud cover may create
      cooler and softer daylight
      conditions through the day.
    `;
    }

    return `
    Weather conditions look stable.
    Great time for outdoor plans
    and light travel activity.
  `;
  }
}
