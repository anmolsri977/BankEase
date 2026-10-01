import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'dashboard', component: DummyComponent, canActivate: [authGuard] },
          { path: 'login', component: DummyComponent }
        ])
      ]
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow access to protected route when user is authenticated', () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    expect(authService.isLoggedIn()).toBe(true);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBe(true);
  });

  it('should redirect unauthenticated user to /login', () => {
    expect(authService.isLoggedIn()).toBe(false);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('should navigate to protected route when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');

    const canNavigate = await router.navigate(['/dashboard']);

    expect(canNavigate).toBe(true);
    expect(router.url).toBe('/dashboard');
  });

  it('should redirect navigation to /login when unauthenticated', async () => {
    await router.navigate(['/dashboard']);

    expect(router.url).toBe('/login');
  });
});
