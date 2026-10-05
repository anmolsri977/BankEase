import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Register } from './register';
import { AuthService, AuthResponse } from '../../core/services/auth.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authServiceSpy: { register: ReturnType<typeof vi.fn> };
  let router: Router;
  let navigateSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      register: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should validate empty form as invalid with required fields', () => {
      expect(component.registerForm.valid).toBe(false);
      expect(component.name?.errors?.['required']).toBeTruthy();
      expect(component.email?.errors?.['required']).toBeTruthy();
      expect(component.password?.errors?.['required']).toBeTruthy();
      expect(component.phone?.errors?.['required']).toBeTruthy();
      expect(component.kycStatus?.value).toBe('PENDING');
    });

    it('should validate name minimum length of 2 characters', () => {
      component.registerForm.controls['name'].setValue('A');
      expect(component.name?.errors?.['minlength']).toBeTruthy();

      component.registerForm.controls['name'].setValue('Al');
      expect(component.name?.errors).toBeNull();
    });

    it('should validate invalid email format', () => {
      component.registerForm.controls['email'].setValue('invalid-email-format');
      expect(component.email?.errors?.['email']).toBeTruthy();

      component.registerForm.controls['email'].setValue('user@bankease.com');
      expect(component.email?.errors).toBeNull();
    });

    it('should validate short password below 8 characters', () => {
      component.registerForm.controls['password'].setValue('Pass12!');
      expect(component.password?.errors?.['minlength']).toBeTruthy();

      component.registerForm.controls['password'].setValue('Password123!');
      expect(component.password?.errors).toBeNull();
    });

    it('should validate invalid phone numbers', () => {
      // Must be 10 digits starting with 6, 7, 8, or 9
      component.registerForm.controls['phone'].setValue('1234567890'); // Starts with 1
      expect(component.phone?.errors?.['pattern']).toBeTruthy();

      component.registerForm.controls['phone'].setValue('98765'); // Less than 10 digits
      expect(component.phone?.errors?.['pattern']).toBeTruthy();

      component.registerForm.controls['phone'].setValue('98765432101'); // More than 10 digits
      expect(component.phone?.errors?.['pattern']).toBeTruthy();

      component.registerForm.controls['phone'].setValue('abcdefghij'); // Non-numeric
      expect(component.phone?.errors?.['pattern']).toBeTruthy();

      component.registerForm.controls['phone'].setValue('9876543210'); // Valid Indian mobile
      expect(component.phone?.errors).toBeNull();
    });

    it('should be valid when all required fields have valid data', () => {
      component.registerForm.setValue({
        name: 'Jane Doe',
        email: 'jane.doe@bankease.com',
        password: 'Password123!',
        phone: '9876543210',
        kycStatus: 'PENDING'
      });

      expect(component.registerForm.valid).toBe(true);
    });

    it('should not call AuthService.register on invalid submission', () => {
      component.onSubmit();

      expect(authServiceSpy.register).not.toHaveBeenCalled();
      expect(component.registerForm.touched).toBe(true);
    });
  });

  describe('Registration Submission & Navigation', () => {
    it('should call AuthService.register and navigate to /login on successful registration', () => {
      const mockResponse: AuthResponse = { token: 'mock-jwt-token' };
      authServiceSpy.register.mockReturnValue(of(mockResponse));

      component.registerForm.setValue({
        name: 'John Doe',
        email: 'john.doe@bankease.com',
        password: 'Password123!',
        phone: '9123456780',
        kycStatus: 'PENDING'
      });

      component.onSubmit();

      expect(authServiceSpy.register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john.doe@bankease.com',
        password: 'Password123!',
        phone: '9123456780',
        kycStatus: 'PENDING'
      });
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
      expect(component.successMessage).toBe('Registration successful! Redirecting to login...');
      expect(component.errorMessage).toBe('');
      expect(component.isLoading).toBe(false);
    });

    it('should display user-friendly error message on failed registration without exposing backend trace', () => {
      authServiceSpy.register.mockReturnValue(
        throwError(() => new Error('Internal Server Error: DB connection failed at com.bankease.backend'))
      );

      component.registerForm.setValue({
        name: 'John Doe',
        email: 'john.doe@bankease.com',
        password: 'Password123!',
        phone: '9123456780',
        kycStatus: 'PENDING'
      });

      component.onSubmit();

      expect(authServiceSpy.register).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Registration failed. Please check your details and try again.');
      expect(component.errorMessage).not.toContain('Internal Server Error');
      expect(component.errorMessage).not.toContain('DB connection');
      expect(component.isLoading).toBe(false);
    });

    it('should ensure ADMIN role cannot be submitted', () => {
      expect(component.registerForm.contains('role')).toBe(false);

      authServiceSpy.register.mockReturnValue(of({ token: 'mock-token' }));

      // Fill form and attempt to tamper with form or payload
      component.registerForm.setValue({
        name: 'Attacker User',
        email: 'attacker@bankease.com',
        password: 'Password123!',
        phone: '9876543210',
        kycStatus: 'PENDING'
      });

      component.onSubmit();

      const submittedPayload = authServiceSpy.register.mock.calls[0][0];
      expect(submittedPayload.role).toBeUndefined();
      expect((submittedPayload as any).role).not.toBe('ADMIN');
      expect(Object.keys(submittedPayload)).toEqual(['name', 'email', 'password', 'phone', 'kycStatus']);
    });

    it('should prevent duplicate submissions while request is in progress', () => {
      // Simulate an ongoing request with subject
      authServiceSpy.register.mockReturnValue(of({ token: 'mock-token' }));

      component.registerForm.setValue({
        name: 'John Doe',
        email: 'john.doe@bankease.com',
        password: 'Password123!',
        phone: '9123456780',
        kycStatus: 'PENDING'
      });

      component.isLoading = true;
      component.onSubmit();

      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should update button text and disable button while request is in progress and restore on completion', async () => {
      const subject = new Subject<AuthResponse>();
      authServiceSpy.register.mockReturnValue(subject.asObservable());

      component.registerForm.setValue({
        name: 'John Doe',
        email: 'john.doe@bankease.com',
        password: 'Password123!',
        phone: '9123456780',
        kycStatus: 'PENDING'
      });

      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.textContent?.trim()).toBe('Register');
      expect(button.disabled).toBe(false);

      component.onSubmit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.isLoading).toBe(true);
      expect(button.textContent?.trim()).toBe('Creating Account...');
      expect(button.disabled).toBe(true);

      subject.next({ token: 'mock-token' });
      subject.complete();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.isLoading).toBe(false);
      expect(button.disabled).toBe(false);
      expect(button.textContent?.trim()).toBe('Register');
    });

    it('should reset loading state and restore button when request fails', async () => {
      const subject = new Subject<AuthResponse>();
      authServiceSpy.register.mockReturnValue(subject.asObservable());

      component.registerForm.setValue({
        name: 'John Doe',
        email: 'john.doe@bankease.com',
        password: 'Password123!',
        phone: '9123456780',
        kycStatus: 'PENDING'
      });

      component.onSubmit();
      fixture.detectChanges();
      await fixture.whenStable();

      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(component.isLoading).toBe(true);
      expect(button.textContent?.trim()).toBe('Creating Account...');
      expect(button.disabled).toBe(true);

      subject.error(new Error('Network error'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.isLoading).toBe(false);
      expect(button.disabled).toBe(false);
      expect(button.textContent?.trim()).toBe('Register');
      expect(component.errorMessage).toBe('Registration failed. Please check your details and try again.');
    });
  });
});
