export interface WeatherData {
  city: string;

  temperature: string;

  condition: string;

  stats: WeatherStat[];
}

export interface WeatherStat {
  label: string;

  value: string;
}
