import { Component, signal, computed } from '@angular/core';

import { WeatherHeroComponent } from '../../widgets/weather-hero/weather-hero.component';
import { StatCardComponent } from '../../widgets/stat-card/stat-card.component';

@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  imports: [WeatherHeroComponent, StatCardComponent],
  templateUrl: './weather-dashboard.component.html',
  styleUrl: './weather-dashboard.component.scss',
})
export class WeatherDashboardComponent {
  readonly city = signal('Hyderabad');

  readonly temperature = signal('28°C');

  readonly condition = signal('sunny');

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
}
