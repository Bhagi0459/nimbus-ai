import { inject, Injectable } from '@angular/core';
import { WeatherData } from '../../features/weather/models/weather.model';
import { WeatherInsight } from '../../features/weather/models/weather-insight.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class WeatherAiService {
  private readonly http = inject(HttpClient);

  async generateInsight(
    weatherData: WeatherData,

    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const humidity =
      weatherData.stats.find((stat) => stat.label === 'Humidity')?.value || '';

    const wind =
      weatherData.stats.find((stat) => stat.label === 'Wind')?.value || '';

    const response = await fetch(
      'http://localhost:3000/weather-insight',

      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          city: weatherData.city,

          temperature: weatherData.temperature,

          condition: weatherData.condition,

          humidity,

          wind,
        }),
      },
    );

    const reader = response.body?.getReader();

    const decoder = new TextDecoder();

    while (true) {
      const result = await reader?.read();

      if (!result || result.done) {
        break;
      }

      const chunk = decoder.decode(result.value);

      onChunk(chunk);
    }
  }

  private async simulateThinking(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });
  }
}
