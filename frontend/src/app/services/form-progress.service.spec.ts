import { TestBed } from '@angular/core/testing';

import { FormProgressService } from './form-progress.service';

describe('FormProgressService', () => {
  let service: FormProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
