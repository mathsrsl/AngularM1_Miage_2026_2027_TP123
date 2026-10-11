import '../../../test-setup';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('ajoute Authorization lorsqu’un token existe', () => {
    authService.token.set('fake-token-abc');

    http.get('/api/tracks').subscribe();

    const req = httpTesting.expectOne('/api/tracks');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token-abc');

    req.flush([]);
  });

  it('ne met pas Authorization si aucun token n’existe', () => {
    authService.token.set(null);

    http.get('/api/tracks').subscribe();

    const req = httpTesting.expectOne('/api/tracks');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush([]);
  });
});
