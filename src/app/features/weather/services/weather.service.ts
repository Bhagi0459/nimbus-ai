import { Injectable } from '@angular/core';

import { WeatherData } from '../models/weather.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  getWeatherByCity(city: string): WeatherData {
    const normalizedCity = city.toLowerCase();

    if (normalizedCity === 'mumbai') {
      return {
        city: 'Mumbai',
        temperature: '31°C',
        condition: 'Sunny',

        stats: [
          {
            label: 'Humidity',
            value: '58%',
          },
          {
            label: 'Wind',
            value: '8 km/h',
          },
          {
            label: 'UV Index',
            value: '7',
          },
          {
            label: 'Feels Like',
            value: '35°C',
          },
        ],
      };
    }

    if (normalizedCity === 'delhi') {
      return {
        city: 'Delhi',
        temperature: '24°C',
        condition: 'Cloudy',

        stats: [
          {
            label: 'Humidity',
            value: '76%',
          },
          {
            label: 'Wind',
            value: '14 km/h',
          },
          {
            label: 'UV Index',
            value: '3',
          },
          {
            label: 'Feels Like',
            value: '26°C',
          },
        ],
      };
    }

    return {
      city: 'Hyderabad',
      temperature: '28°C',
      condition: 'Rainy',

      stats: [
        {
          label: 'Humidity',
          value: '72%',
        },
        {
          label: 'Wind',
          value: '12 km/h',
        },
        {
          label: 'UV Index',
          value: '4',
        },
        {
          label: 'Feels Like',
          value: '31°C',
        },
      ],
    };
  }
}
