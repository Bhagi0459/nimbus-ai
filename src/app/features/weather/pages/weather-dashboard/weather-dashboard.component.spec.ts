import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { WeatherDashboardComponent } from './weather-dashboard.component';

describe('WeatherDashboardComponent', () => {
  let component: WeatherDashboardComponent;
  let fixture: ComponentFixture<WeatherDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    // Deliberately not calling fixture.detectChanges(): a full render here
    // pulls in ApexCharts/Leaflet, which try to lay out DOM nodes and geolocation
    // in ways headless Karma can't support. Constructing the component alone
    // still exercises the thing actually worth smoke-testing here — that its
    // DI graph (WeatherService, WeatherAiService, HttpClient) wires up cleanly.
    fixture = TestBed.createComponent(WeatherDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
