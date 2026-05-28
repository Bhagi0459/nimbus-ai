import { Injectable } from '@angular/core';

import { WeatherData } from '../../features/weather/models/weather.model';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WeatherAiService {

  
  async generateInsight(
    weatherData: WeatherData,

    onChunk: (chunk: string) => void,
  ): Promise<void> {
    try {
      const humidity =
        weatherData.stats.find((stat) => stat.label === 'Humidity')?.value ||
        '';

      const wind =
        weatherData.stats.find((stat) => stat.label === 'Wind')?.value || '';

      const response = await fetch(`${environment.aiApiUrl}/weather-insight`, {
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
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      if (!response.body) {
        throw new Error('Streaming not supported');
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      while (true) {
        const result = await reader.read();

        if (result.done) {
          break;
        }

        const chunk = decoder.decode(result.value);

        onChunk(chunk);
      }
    } catch (error) {
      console.error('AI Insight Error:', error);

      onChunk('Unable to generate weather insight right now.');
    }
  }
}
