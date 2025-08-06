import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircleStatComponent } from './circle-stat.component';

describe('CircleStatComponent', () => {
  let component: CircleStatComponent;
  let fixture: ComponentFixture<CircleStatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircleStatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircleStatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
