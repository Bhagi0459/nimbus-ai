import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForecastTimelineComponent } from './forecast-timeline.component';

describe('ForecastTimelineComponent', () => {
  let component: ForecastTimelineComponent;
  let fixture: ComponentFixture<ForecastTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForecastTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForecastTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
