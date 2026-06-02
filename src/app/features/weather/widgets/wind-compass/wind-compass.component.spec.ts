import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindCompassComponent } from './wind-compass.component';

describe('WindCompassComponent', () => {
  let component: WindCompassComponent;
  let fixture: ComponentFixture<WindCompassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WindCompassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WindCompassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
