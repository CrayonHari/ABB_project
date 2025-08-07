import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorsuccessboxComponent } from './errorsuccessbox.component';

describe('ErrorsuccessboxComponent', () => {
  let component: ErrorsuccessboxComponent;
  let fixture: ComponentFixture<ErrorsuccessboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorsuccessboxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorsuccessboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
