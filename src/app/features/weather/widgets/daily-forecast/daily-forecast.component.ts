import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyForecast } from '../../models/daily-forecast.model';

@Component({
  selector: 'app-daily-forecast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-forecast.component.html',
  styleUrl: './daily-forecast.component.scss',
})
export class DailyForecastComponent {
  readonly forecast = input<DailyForecast[]>([]);
  readonly isLoading = input(false);
}
