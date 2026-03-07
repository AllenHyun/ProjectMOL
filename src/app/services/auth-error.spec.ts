import { TestBed } from '@angular/core/testing';

import { AuthError } from './auth-error';

describe('AuthError', () => {
  let service: AuthError;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthError);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
