import { TestBed } from '@angular/core/testing';

import { WeatherAiService } from './weather-ai.service';

describe('WeatherAiService', () => {
  let service: WeatherAiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeatherAiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
