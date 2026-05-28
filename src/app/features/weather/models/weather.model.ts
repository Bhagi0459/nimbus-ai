import { DailyForecast } from './daily-forecast.model';
import { ForecastHour } from './forecast-hour.model';

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
}

export interface WeatherStat {
  label: string;

  value: string;
}
