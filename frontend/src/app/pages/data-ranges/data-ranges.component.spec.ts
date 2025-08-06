import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataRangesComponent } from './data-ranges.component';

describe('DataRangesComponent', () => {
  let component: DataRangesComponent;
  let fixture: ComponentFixture<DataRangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataRangesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataRangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
