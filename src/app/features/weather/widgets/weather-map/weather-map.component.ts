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

  private marker?: L.Marker;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && (changes['latitude'] || changes['longitude'])) {
      const coordinates = [this.latitude(), this.longitude()] as [
        number,
        number,
      ];

      this.map.setView(coordinates, 10, {
        animate: true,
      });

      this.marker?.setLatLng(coordinates);

      this.marker?.bindPopup(
        `
          <div class="map-popup">
            <strong>
              ${this.city()}
            </strong>
          </div>
        `,
      );

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 250);
    }
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.initializeMap();

        this.map?.invalidateSize(true);
      }, 250);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initializeMap(): void {
    const coordinates = [this.latitude(), this.longitude()] as [number, number];

    this.map = L.map('weather-map', {
      zoomControl: false,
    }).setView(coordinates, 10);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
    ).addTo(this.map);

    const weatherIcon = L.divIcon({
      className: 'weather-marker',

      html: `
          <div class="marker-glow"></div>
          <div class="marker-core"></div>
        `,

      iconSize: [30, 30],

      iconAnchor: [15, 15],
    });

    this.marker = L.marker(coordinates, {
      icon: weatherIcon,
    })
      .addTo(this.map)
      .bindPopup(
        `
          <div class="map-popup">
            <strong>
              ${this.city()}
            </strong>
          </div>
        `,
      );

    setTimeout(() => {
      this.map?.invalidateSize(true);
    }, 500);
  }
}
