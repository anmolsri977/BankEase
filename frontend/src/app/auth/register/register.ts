import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, RegisterRequest } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    kycStatus: ['PENDING']
  });

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  get name() {
    return this.registerForm.get('name');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get phone() {
    return this.registerForm.get('phone');
  }

  get kycStatus() {
    return this.registerForm.get('kycStatus');
  }

  onSubmit(): void {
    if (this.isLoading) {
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    const formValue = this.registerForm.value;

    // Explicitly map allowed fields only - preventing any arbitrary role or ADMIN submission
    const payload: RegisterRequest = {
      name: (formValue.name || '').trim(),
      email: (formValue.email || '').trim(),
      password: formValue.password || '',
      phone: (formValue.phone || '').trim(),
      kycStatus: formValue.kycStatus || 'PENDING'
    };

    this.authService
      .register(payload)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Registration successful! Redirecting to login...';
          this.cdr.markForCheck();
          this.router.navigate(['/login']);
        },
        error: () => {
          this.errorMessage = 'Registration failed. Please check your details and try again.';
          this.cdr.markForCheck();
        }
      });
  }
}
