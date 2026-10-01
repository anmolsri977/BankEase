import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, LoginRequest, RegisterRequest, AuthResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST request to register user', () => {
    const mockRequest: RegisterRequest = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      phone: '1234567890'
    };
    const mockResponse: AuthResponse = { token: 'mock-jwt-token-register' };

    service.register(mockRequest).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should send POST request to login and store token in localStorage', () => {
    const mockRequest: LoginRequest = {
      email: 'john@example.com',
      password: 'Password123!'
    };
    const mockResponse: AuthResponse = { token: 'mock-jwt-token-login' };

    service.login(mockRequest).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(service.getToken()).toBe('mock-jwt-token-login');
      expect(service.isLoggedIn()).toBe(true);
    });

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should remove token on logout', () => {
    localStorage.setItem('bankease_token', 'test-token');
    expect(service.isLoggedIn()).toBe(true);

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should correctly report isLoggedIn status', () => {
    expect(service.isLoggedIn()).toBe(false);

    localStorage.setItem('bankease_token', 'sample-token');
    expect(service.isLoggedIn()).toBe(true);

    localStorage.removeItem('bankease_token');
    expect(service.isLoggedIn()).toBe(false);
  });
});
