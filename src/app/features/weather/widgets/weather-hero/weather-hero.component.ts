import { Component, input } from '@angular/core';
@Component({
  selector: 'app-weather-hero',
  standalone: true,
  imports: [],
  templateUrl: './weather-hero.component.html',
  styleUrl: './weather-hero.component.scss',
})
export class WeatherHeroComponent {
  readonly temperature = input<string>();
  readonly city = input<string>();
  readonly condition = input<string>();
  readonly isLoading = input(false);
  readonly feelsLike = input('');
  readonly conditionIcon = input('');
  readonly localTime = input('');
  readonly greeting = input('');
}
