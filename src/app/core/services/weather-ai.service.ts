import { Injectable } from '@angular/core';
import { WeatherData } from '../../features/weather/models/weather.model';
import { WeatherInsight } from '../../features/weather/models/weather-insight.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherAiService {
  async generateInsight(weatherData: WeatherData): Promise<WeatherInsight> {
    await this.simulateThinking();

    const condition = weatherData.condition.toLowerCase();

    const temperature = Number.parseFloat(weatherData.temperature);

    const humidity = Number.parseFloat(
      weatherData.stats.find((stat) => stat.label === 'Humidity')?.value || '0',
    );

    if (condition.includes('rain')) {
      return {
        severity: 'medium',

        summary: `
          Rainy conditions expected.
          Carry an umbrella and
          expect slower commutes.
          `,
      };
    }

    if (temperature >= 35) {
      return {
        severity: 'high',

        summary: `
          High temperatures detected.
          Stay hydrated and avoid
          prolonged afternoon exposure.
          `,
      };
    }

    if (humidity >= 75) {
      return {
        severity: 'medium',

        summary: `
          Humidity levels are elevated.
          It may feel warmer than
          the reported temperature.
          `,
      };
    }

    if (condition.includes('cloud')) {
      return {
        severity: 'low',

        summary: `
          Cloud cover may create
          cooler and softer daylight
          conditions throughout the day.
          `,
      };
    }

    return {
      severity: 'low',

      summary: `
        Weather conditions look stable.
        Great time for outdoor plans
        and light travel activity.
        `,
    };
  }

  private async simulateThinking(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });
  }
}
