import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiInterceptor, getBackendUrl } from './api.interceptor';
import { environment } from '../../../environments/environment';

describe('apiInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      delete (window as any).__env;
    }
    environment.apiUrl = '';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    if (typeof window !== 'undefined') {
      delete (window as any).__env;
    }
    environment.apiUrl = '';
  });

  it('should keep relative /api URL when no backend URL is configured', () => {
    httpClient.get('/api/accounts/my').subscribe();

    const req = httpTesting.expectOne('/api/accounts/my');
    expect(req.request.url).toBe('/api/accounts/my');
    req.flush({});
  });

  it('should prefix /api request with environment.apiUrl when configured', () => {
    environment.apiUrl = 'https://api.bankease.example.com';

    httpClient.get('/api/accounts/my').subscribe();

    const req = httpTesting.expectOne('https://api.bankease.example.com/api/accounts/my');
    expect(req.request.url).toBe('https://api.bankease.example.com/api/accounts/my');
    req.flush({});
  });

  it('should trim trailing slash from configured backend URL', () => {
    environment.apiUrl = 'https://api.bankease.example.com/';

    httpClient.get('/api/transactions').subscribe();

    const req = httpTesting.expectOne('https://api.bankease.example.com/api/transactions');
    expect(req.request.url).toBe('https://api.bankease.example.com/api/transactions');
    req.flush({});
  });

  it('should prioritize window.__env.BACKEND_URL when defined', () => {
    (window as any).__env = {
      BACKEND_URL: 'https://backend.bankease.internal'
    };

    expect(getBackendUrl()).toBe('https://backend.bankease.internal');

    httpClient.get('/api/loans').subscribe();

    const req = httpTesting.expectOne('https://backend.bankease.internal/api/loans');
    expect(req.request.url).toBe('https://backend.bankease.internal/api/loans');
    req.flush({});
  });

  it('should leave non-/api URLs untouched', () => {
    environment.apiUrl = 'https://api.bankease.example.com';

    httpClient.get('https://external-service.com/health').subscribe();

    const req = httpTesting.expectOne('https://external-service.com/health');
    expect(req.request.url).toBe('https://external-service.com/health');
    req.flush({});
  });
});
