import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineChartFilledComponent } from './line-chart-filled.component';

describe('LineChartFilledComponent', () => {
  let component: LineChartFilledComponent;
  let fixture: ComponentFixture<LineChartFilledComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartFilledComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineChartFilledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
