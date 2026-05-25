import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherHeroComponent } from './weather-hero.component';

describe('WeatherHeroComponent', () => {
  let component: WeatherHeroComponent;
  let fixture: ComponentFixture<WeatherHeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherHeroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeatherHeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
