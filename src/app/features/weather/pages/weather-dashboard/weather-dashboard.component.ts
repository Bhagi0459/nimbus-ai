import { Component, signal, computed, inject } from '@angular/core';

import { WeatherHeroComponent } from '../../widgets/weather-hero/weather-hero.component';
import { StatCardComponent } from '../../widgets/stat-card/stat-card.component';
import { WeatherSearchComponent } from '../../widgets/weather-search/weather-search.component';
import { WeatherService } from '../../services/weather.service';

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
    const currentCondition = this.condition().toLowerCase();

    if (currentCondition.includes('rain')) {
      return 'rainy';
    }

    if (currentCondition.includes('cloud')) {
      return 'cloudy';
    }

    if (currentCondition.includes('sun')) {
      return 'sunny';
    }

    return 'default';
  });

  searchCity(city: string): void {
    const weatherData = this.weatherService.getWeatherByCity(city);

    this.city.set(weatherData.city);

    this.temperature.set(weatherData.temperature);

    this.condition.set(weatherData.condition);

    this.stats.set(weatherData.stats);
  }
}
