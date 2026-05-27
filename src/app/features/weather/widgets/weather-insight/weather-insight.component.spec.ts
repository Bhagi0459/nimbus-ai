import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherInsightComponent } from './weather-insight.component';

describe('WeatherInsightComponent', () => {
  let component: WeatherInsightComponent;
  let fixture: ComponentFixture<WeatherInsightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherInsightComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeatherInsightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
