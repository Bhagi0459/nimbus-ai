import { Component, input } from '@angular/core';
import { ForecastHour } from '../../models/forecast-hour.model';

@Component({
  selector: 'app-forecast-timeline',
  standalone: true,
  imports: [],
  templateUrl: './forecast-timeline.component.html',
  styleUrl: './forecast-timeline.component.scss',
})
export class ForecastTimelineComponent {
  readonly forecast = input<ForecastHour[]>([]);
}
