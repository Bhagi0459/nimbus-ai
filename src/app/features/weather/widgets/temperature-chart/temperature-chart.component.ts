import { Component, computed, input } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexMarkers,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';

import { ForecastHour } from '../../models/forecast-hour.model';

@Component({
  selector: 'app-temperature-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './temperature-chart.component.html',
  styleUrl: './temperature-chart.component.scss',
})
export class TemperatureChartComponent {
  readonly forecast = input<ForecastHour[]>([]);
  readonly isLoading = input(false);

  readonly temperatures = computed(() =>
    this.forecast().map((item) =>
      Number.parseFloat(item.temperature.replace('°C', '')),
    ),
  );

  readonly chartSeries = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Temperature',
      data: this.temperatures(),
    },
  ]);

  readonly xaxis = computed<ApexXAxis>(() => ({
    categories: this.forecast().map((item) => item.time),
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      hideOverlappingLabels: false,
      style: {
        colors: '#94a3b8',
        fontSize: '12px',
        fontWeight: 500,
      },
    },
  }));

  readonly chart: ApexChart = {
    type: 'area',
    height: 310,
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    parentHeightOffset: 0,
    animations: {
      enabled: true,
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
    foreColor: '#ffffff',
  };

  readonly dataLabels: ApexDataLabels = {
    enabled: false,
  };

  readonly stroke: ApexStroke = {
    curve: 'smooth',
    width: 4,
  };

  readonly fill: ApexFill = {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.18,
      opacityTo: 0.01,
      stops: [0, 100],
    },
  };

  readonly tooltip: ApexTooltip = {
    theme: 'dark',
  };

  readonly markers: ApexMarkers = {
    size: 3,
    hover: {
      size: 7,
    },
  };

  readonly yaxis = computed<ApexYAxis>(() => {
    const temps = this.temperatures();

    if (!temps.length) {
      return {
        show: false,
      };
    }

    const min = Math.min(...temps);
    const max = Math.max(...temps);

    return {
      show: false,
      min: Math.floor(min - 2),
      max: Math.ceil(max + 2),
    };
  });

  readonly grid: ApexGrid = {
    borderColor: 'rgba(255,255,255,0.03)',
    strokeDashArray: 4,
    padding: {
      left: 18,
      right: 8,
      top: 10,
      bottom: 0,
    },
  };

  readonly colors = ['#7dd3fc'];
}
