import { Component, computed, input } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexFill,
  ApexGrid,
  ApexMarkers,
  ApexStates,
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

  readonly temperatures = computed(() =>
    this.forecast().map((item) => Number.parseFloat(item.temperature)),
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
      style: {
        colors: '#94a3b8',

        fontSize: '12px',

        fontWeight: 500,
      },
    },
  }));

  readonly chart = {
    type: 'line',

    height: 280,

    parentHeightOffset: 0,

    toolbar: {
      show: false,
    },

    zoom: {
      enabled: false,
    },

    animations: {
      enabled: true,

      easing: 'easeinout',

      speed: 900,
    },

    foreColor: '#ffffff',

    // dropShadow: {
    //   enabled: true,

    //   top: 0,

    //   left: 0,

    //   blur: 8,

    //   color: '#38bdf8',

    //   opacity: 0.4,
    // },
  } as ApexChart;

  readonly stroke = {
    curve: 'smooth' as const,

    width: 4.5,

    lineCap: 'round',

    colors: ['#7dd3fc'],
  } as ApexStroke;

  readonly tooltip = {
    theme: 'dark',

    style: {
      fontSize: '14px',
    },

    marker: {
      show: false,
    },
  } as ApexTooltip;

  readonly yaxis = {
    show: false,
  } as ApexYAxis;

  readonly grid = {
    borderColor: 'rgba(255,255,255,0.04)',

    strokeDashArray: 5,

    padding: {
      left: 8,

      right: 8,
    },
  } as ApexGrid;

  readonly fill = {
    opacity: 0,
  } as ApexFill;

  readonly markers = {
    size: 0,

    hover: {
      size: 6,
    },
  } as ApexMarkers;

  readonly states = {
    hover: {
      filter: {
        type: 'lighten',
      },
    },
  } as ApexStates;

  // readonly colors = ['#60dfff'];
}
