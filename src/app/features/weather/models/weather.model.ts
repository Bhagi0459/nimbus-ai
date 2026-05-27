export interface WeatherData {
  city: string;

  temperature: string;

  feelsLike: string;

  condition: string;

  conditionIcon: string;

  localTime: string;

  stats: WeatherStat[];
}

export interface WeatherStat {
  label: string;

  value: string;
}
