import { DailyForecast } from './daily-forecast.model';
import { ForecastHour } from './forecast-hour.model';
import { AirQuality } from './air-quality.model';

export interface WeatherData {
  city: string;
  temperature: string;
  feelsLike: string;
  condition: string;
  conditionIcon: string;
  localTime: string;
  stats: WeatherStat[];
  forecast: ForecastHour[];
  latitude: number;
  longitude: number;
  dailyForecast: DailyForecast[];
  maxTemp: string;
  minTemp: string;
  sunrise: string;
  sunset: string;
  airQuality: AirQuality;
  windSpeed: number;

  windDegree: number;

  windDirection: string;
}

export interface WeatherStat {
  icon: string;
  label: string;
  value: string;
}
