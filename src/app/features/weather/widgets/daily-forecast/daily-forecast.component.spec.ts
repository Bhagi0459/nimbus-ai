import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyForecastComponent } from './daily-forecast.component';

describe('DailyForecastComponent', () => {
  let component: DailyForecastComponent;
  let fixture: ComponentFixture<DailyForecastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyForecastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyForecastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
