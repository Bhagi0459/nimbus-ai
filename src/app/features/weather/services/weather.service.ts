import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { WeatherData } from '../models/weather.model';

import { CitySuggestion } from '../models/city-suggestion.model';

import { ForecastHour } from '../models/forecast-hour.model';

import { DailyForecast } from '../models/daily-forecast.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);

  async getWeatherByCity(city: string): Promise<WeatherData> {
    const response = await firstValueFrom(
      this.http.get<any>(environment.weatherApiUrl, {
        params: {
          city,
          // key: environment.weatherApiKey,
          // q: city,
          // days: 7,
          // aqi: 'yes',
        },
      }),
    );

    const coordinates = await this.getCoordinates(city);

    return {
      city: response.location.name,

      temperature: `${response.current.temp_c}°C`,

      condition: response.current.condition.text,

      feelsLike: `${response.current.feelslike_c}°C`,

      conditionIcon: `https:${response.current.condition.icon}`,

      localTime: response.location.localtime,

      latitude: coordinates?.latitude ?? response.location.lat,

      longitude: coordinates?.longitude ?? response.location.lon,

      forecast: this.mapHourlyForecast(response),

      dailyForecast: this.mapDailyForecast(response),

      stats: this.mapStats(response),

      maxTemp: `${response.forecast.forecastday[0].day.maxtemp_c}°C`,

      minTemp: `${response.forecast.forecastday[0].day.mintemp_c}°C`,

      sunrise: response.forecast.forecastday[0].astro.sunrise,

      sunset: response.forecast.forecastday[0].astro.sunset,

      windSpeed: response.current.wind_kph,

      windDegree: response.current.wind_degree,

      windDirection: response.current.wind_dir,

      airQuality: {
        epaIndex: response.current.air_quality['us-epa-index'],

        pm25: response.current.air_quality.pm2_5,

        pm10: response.current.air_quality.pm10,
      },
    };
  }

  async searchCities(query: string): Promise<CitySuggestion[]> {
    if (!query.trim()) {
      return [];
    }

    const response = await firstValueFrom(
      this.http.get<any[]>(environment.weatherSearchApiUrl, {
        params: {
          // key: environment.weatherApiKey,
          q: query,
        },
      }),
    );

    return response.map((city) => ({
      id: city.id,

      name: city.name,

      region: city.region,

      country: city.country,
    }));
  }

  /* -------------------------------- */
  /* HOURLY FORECAST */
  /* -------------------------------- */

  private mapHourlyForecast(response: any): ForecastHour[] {
    return response.forecast.forecastday[0].hour

      .filter((hour: any) => {
        const hourTime = new Date(hour.time);

        return hourTime.getTime() > Date.now();
      })

      .map((hour: any) => ({
        time: new Date(hour.time).toLocaleString('en-US', {
          hour: 'numeric',
          hour12: true,
        }),

        temperature: `${hour.temp_c}°C`,

        icon: `https:${hour.condition.icon}`,
      }));
  }

  /* -------------------------------- */
  /* DAILY FORECAST */
  /* -------------------------------- */

  private mapDailyForecast(response: any): DailyForecast[] {
    return response.forecast.forecastday.map((day: any) => ({
      day: new Date(day.date).toLocaleString('en-US', {
        weekday: 'short',
      }),

      condition: day.day.condition.text,

      icon: `https:${day.day.condition.icon}`,

      maxTemp: `${day.day.maxtemp_c}°C`,

      minTemp: `${day.day.mintemp_c}°C`,

      rainChance: `${day.day.daily_chance_of_rain}%`,
    }));
  }

  /* -------------------------------- */
  /* WEATHER STATS */
  /* -------------------------------- */

  private mapStats(response: any) {
    return [
      {
        icon: 'droplet',
        label: 'Humidity',
        value: `${response.current.humidity}%`,
      },
      {
        icon: 'wind',
        label: 'Wind',
        value: `${response.current.wind_kph} km/h`,
      },
      {
        icon: 'gauge',
        label: 'Pressure',
        value: `${response.current.pressure_mb} mb`,
      },
      {
        icon: 'eye',
        label: 'Visibility',
        value: `${response.current.vis_km} km`,
      },
      {
        icon: 'sun',
        label: 'UV Index',
        value: `${response.current.uv}`,
      },
      {
        icon: 'zap',
        label: 'Wind Gust',
        value: `${response.current.gust_kph} km/h`,
      },
      {
        icon: 'cloud',
        label: 'Cloud Cover',
        value: `${response.current.cloud}%`,
      },
      {
        icon: 'thermometer',
        label: 'Dew Point',
        value: `${response.current.dewpoint_c}°C`,
      },
    ];
  }

  private async getCoordinates(city: string): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>('https://nominatim.openstreetmap.org/search', {
          params: {
            q: city,
            format: 'json',
            limit: 1,
          },
        }),
      );

      if (!response.length) {
        return null;
      }

      return {
        latitude: Number(response[0].lat),
        longitude: Number(response[0].lon),
      };
    } catch {
      return null;
    }
  }
}
