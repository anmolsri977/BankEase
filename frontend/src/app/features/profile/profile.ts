import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from './profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  profile: UserProfile | null = null;
  isLoading: boolean = false;
  isSaving: boolean = false;
  isEditing: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.pattern('^[6-9]\\d{9}$')]]
  });

  get name() {
    return this.profileForm.get('name');
  }

  get phone() {
    return this.profileForm.get('phone');
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.profileForm.patchValue({
          name: data.name || '',
          phone: data.phone || ''
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        const backendMsg = err?.error?.error;
        if (backendMsg && typeof backendMsg === 'string' && !backendMsg.includes('Exception')) {
          this.errorMessage = backendMsg;
        } else {
          this.errorMessage = 'Unable to load profile. Please try again.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.errorMessage = '';
    this.successMessage = '';
    if (this.isEditing && this.profile) {
      this.profileForm.patchValue({
        name: this.profile.name || '',
        phone: this.profile.phone || ''
      });
    }
    this.cdr.markForCheck();
  }

  onSaveProfile(): void {
    if (this.isSaving) return;

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    const formVal = this.profileForm.value;
    this.profileService.updateProfile({
      name: formVal.name?.trim(),
      phone: formVal.phone?.trim() || undefined
    }).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.isSaving = false;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully!';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        const backendMsg = err?.error?.error;
        if (backendMsg && typeof backendMsg === 'string' && !backendMsg.includes('Exception')) {
          this.errorMessage = backendMsg;
        } else {
          this.errorMessage = 'Failed to update profile. Please verify your details.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  dismissMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
