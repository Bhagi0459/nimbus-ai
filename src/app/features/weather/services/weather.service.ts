import { Injectable } from '@angular/core';
import { WeatherData } from '../models/weather.model';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CitySuggestion } from '../models/city-suggestion.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);

  async getWeatherByCity(city: string): Promise<WeatherData> {
    const response = await firstValueFrom(
      this.http.get<any>(environment.weatherApiUrl, {
        params: {
          key: environment.weatherApiKey,

          q: city,
        },
      }),
    );

    return {
      city: response.location.name,

      temperature: `${response.current.temp_c}°C`,

      condition: response.current.condition.text,

      feelsLike: `${response.current.feelslike_c}°C`,

      conditionIcon: `https:${response.current.condition.icon}`,

      localTime: response.location.localtime,

      stats: [
        {
          label: 'Humidity',
          value: `${response.current.humidity}%`,
        },
        {
          label: 'Wind',
          value: `${response.current.wind_kph} km/h`,
        },
        {
          label: 'UV Index',
          value: `${response.current.uv}`,
        },
        {
          label: 'Feels Like',
          value: `${response.current.feelslike_c}°C`,
        },
      ],
    };
  }

  async searchCities(query: string): Promise<CitySuggestion[]> {
    if (!query.trim()) {
      return [];
    }

    const response = await firstValueFrom(
      this.http.get<any[]>(environment.weatherSearchApiUrl, {
        params: {
          key: environment.weatherApiKey,

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
}
