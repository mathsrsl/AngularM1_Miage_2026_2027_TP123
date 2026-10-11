import '../../../test-setup';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('login() utilise POST /api/auth/login avec le bon corps', () => {
    const mockResponse = {
      token: 'test-jwt-token',
      user: {
        id: 'user-456',
        name: 'Guitariste',
        email: 'test@example.com',
        createdAt: '2026-10-11',
      },
    };

    service.login('test@example.com', 'password123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(service.token()).toBe('test-jwt-token');
      expect(service.currentUser()?.email).toBe('test@example.com');
    });

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'test@example.com',
      password: 'password123',
    });

    req.flush(mockResponse);
  });
});
