import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { formStepGuard } from './form-step.guard';

describe('formStepGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => formStepGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
