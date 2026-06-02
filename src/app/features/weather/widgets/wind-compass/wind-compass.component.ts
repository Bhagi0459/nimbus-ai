import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-wind-compass',
  standalone: true,
  imports: [],
  templateUrl: './wind-compass.component.html',
  styleUrl: './wind-compass.component.scss',
})
export class WindCompassComponent {
  readonly windSpeed = input<number>(0);
  readonly windDegree = input<number>(0);
  readonly windDirection = input('');
  readonly isLoading = input(false);
  readonly fullDirection = computed(() => {
    const map: Record<string, string> = {
      N: 'North',
      NNE: 'North-Northeast',
      NE: 'Northeast',
      ENE: 'East-Northeast',
      E: 'East',
      ESE: 'East-Southeast',
      SE: 'Southeast',
      SSE: 'South-Southeast',
      S: 'South',
      SSW: 'South-Southwest',
      SW: 'Southwest',
      WSW: 'West-Southwest',
      W: 'West',
      WNW: 'West-Northwest',
      NW: 'Northwest',
      NNW: 'North-Northwest',
    };
    return map[this.windDirection()] ?? this.windDirection();
  });
}
