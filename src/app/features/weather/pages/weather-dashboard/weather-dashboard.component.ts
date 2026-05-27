import { Component, signal, computed, inject } from '@angular/core';

import { WeatherHeroComponent } from '../../widgets/weather-hero/weather-hero.component';
import { StatCardComponent } from '../../widgets/stat-card/stat-card.component';
import { WeatherSearchComponent } from '../../widgets/weather-search/weather-search.component';
import { WeatherService } from '../../services/weather.service';
import { CitySuggestion } from '../../models/city-suggestion.model';

@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  imports: [WeatherHeroComponent, WeatherSearchComponent, StatCardComponent],
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

    const sunnyConditions = ['sunny', 'clear'];

    const cloudyConditions = ['cloud', 'mist', 'fog', 'overcast'];

    const rainyConditions = ['rain', 'drizzle', 'thunder'];

    if (sunnyConditions.some((item) => condition.includes(item))) {
      return 'sunny';
    }

    if (cloudyConditions.some((item) => condition.includes(item))) {
      return 'cloudy';
    }

    if (rainyConditions.some((item) => condition.includes(item))) {
      return 'rainy';
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

  async searchSuggestions(query: string): Promise<void> {
    const suggestions = await this.weatherService.searchCities(query);

    this.suggestions.set(suggestions);
  }
}
