import {
  AfterViewInit,
  Component,
  OnDestroy,
  input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import * as L from 'leaflet';

@Component({
  selector: 'app-weather-map',

  standalone: true,

  imports: [],

  templateUrl: './weather-map.component.html',

  styleUrl: './weather-map.component.scss',
})
export class WeatherMapComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  readonly city = input('Hyderabad');

  readonly latitude = input(17.385);

  readonly longitude = input(78.4867);

  private map?: L.Map;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && (changes['latitude'] || changes['longitude'])) {
      this.map.setView([this.latitude(), this.longitude()], 10, {
        animate: true,
      });

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 200);
    }
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.initializeMap();

        this.map?.invalidateSize(true);
      }, 300);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initializeMap(): void {
    this.map = L.map('weather-map', {
      zoomControl: false,
    }).setView([this.latitude(), this.longitude()], 10);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
    ).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize(true);
    }, 500);

    const weatherIcon = L.divIcon({
      className: 'weather-marker',

      html: `
          <div class="marker-glow"></div>
          <div class="marker-core"></div>
        `,

      iconSize: [26, 26],

      iconAnchor: [13, 13],
    });

    L.marker([this.latitude(), this.longitude()], {
      icon: weatherIcon,
    })
      .addTo(this.map)
      .bindPopup(
        `
          <div class="map-popup">
            <strong>${this.city()}</strong>
          </div>
        `,
      );
  }
}
