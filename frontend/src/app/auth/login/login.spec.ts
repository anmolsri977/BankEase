import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService, AuthResponse } from '../../core/services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authServiceSpy: { login: ReturnType<typeof vi.fn> };
  let router: Router;
  let navigateSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      login: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize with an invalid empty form', () => {
      expect(component.loginForm.valid).toBe(false);
      expect(component.email?.errors?.['required']).toBeTruthy();
      expect(component.password?.errors?.['required']).toBeTruthy();
    });

    it('should validate email format', () => {
      component.loginForm.controls['email'].setValue('not-an-email');
      expect(component.email?.errors?.['email']).toBeTruthy();

      component.loginForm.controls['email'].setValue('valid.email@example.com');
      expect(component.email?.errors).toBeNull();
    });

    it('should validate password required', () => {
      component.loginForm.controls['password'].setValue('');
      expect(component.password?.errors?.['required']).toBeTruthy();

      component.loginForm.controls['password'].setValue('Secret123!');
      expect(component.password?.errors).toBeNull();
    });

    it('should be valid when both email and password are valid', () => {
      component.loginForm.setValue({
        email: 'customer@bankease.com',
        password: 'Password123!'
      });

      expect(component.loginForm.valid).toBe(true);
    });

    it('should not call AuthService.login on submit if form is invalid', () => {
      component.onSubmit();

      expect(authServiceSpy.login).not.toHaveBeenCalled();
      expect(component.loginForm.touched).toBe(true);
    });
  });

  describe('Login Submission & Navigation', () => {
    it('should call AuthService.login and navigate to /dashboard on successful login', () => {
      const mockResponse: AuthResponse = { token: 'jwt-test-token' };
      authServiceSpy.login.mockReturnValue(of(mockResponse));

      component.loginForm.setValue({
        email: 'customer@bankease.com',
        password: 'Password123!'
      });

      component.onSubmit();

      expect(authServiceSpy.login).toHaveBeenCalledWith({
        email: 'customer@bankease.com',
        password: 'Password123!'
      });
      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
      expect(component.errorMessage).toBe('');
      expect(component.isLoading).toBe(false);
    });

    it('should display a user-friendly error message and not navigate on failed login', () => {
      authServiceSpy.login.mockReturnValue(throwError(() => new Error('401 Unauthorized')));

      component.loginForm.setValue({
        email: 'customer@bankease.com',
        password: 'WrongPassword!'
      });

      component.onSubmit();

      expect(authServiceSpy.login).toHaveBeenCalledWith({
        email: 'customer@bankease.com',
        password: 'WrongPassword!'
      });
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Invalid email or password. Please try again.');
      expect(component.isLoading).toBe(false);
    });
  });
});
