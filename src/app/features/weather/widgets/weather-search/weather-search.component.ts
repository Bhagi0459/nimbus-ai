import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-weather-search',
  standalone: true,
  imports: [],
  templateUrl: './weather-search.component.html',
  styleUrl: './weather-search.component.scss',
})
export class WeatherSearchComponent {
  readonly cityName = signal('');

  readonly search = output<string>();

  updateCity(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.cityName.set(input.value);
  }

  searchCity(): void {
    if (!this.cityName().trim()) {
      return;
    }

    this.search.emit(this.cityName());
  }
}
