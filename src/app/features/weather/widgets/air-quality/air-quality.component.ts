import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-air-quality',
  standalone: true,
  imports: [],
  templateUrl: './air-quality.component.html',
  styleUrl: './air-quality.component.scss',
})
export class AirQualityComponent {
  readonly epaIndex = input<number>(0);
  readonly pm25 = input<number>(0);
  readonly pm10 = input<number>(0);
  readonly isLoading = input(false);
  readonly airQualityLabel = computed(() => {
    switch (this.epaIndex()) {
      case 1:
        return 'Good';

      case 2:
        return 'Moderate';

      case 3:
        return 'Unhealthy for Sensitive';

      case 4:
        return 'Unhealthy';

      case 5:
        return 'Very Unhealthy';

      default:
        return 'Hazardous';
    }
  });

  readonly airQualityClass = computed(() => {
    switch (this.epaIndex()) {
      case 1:
        return 'good';
      case 2:
        return 'moderate';
      case 3:
        return 'sensitive';
      case 4:
        return 'unhealthy';
      case 5:
        return 'very-unhealthy';
      default:
        return 'hazardous';
    }
  });
}
