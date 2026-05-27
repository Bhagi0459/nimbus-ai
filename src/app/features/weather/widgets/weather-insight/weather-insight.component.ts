import { Component, input } from '@angular/core';

@Component({
  selector: 'app-weather-insight',

  standalone: true,

  imports: [],

  templateUrl: './weather-insight.component.html',

  styleUrl: './weather-insight.component.scss',
})
export class WeatherInsightComponent {
  readonly insight = input('');
  readonly isLoading = input(false);
}
