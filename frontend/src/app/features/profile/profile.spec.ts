import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { Profile } from './profile';
import { ProfileService, UserProfile } from './profile.service';
import { AuthService } from '../../core/services/auth.service';

describe('Profile Component', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let profileServiceSpy: {
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };
  let authServiceSpy: { logout: ReturnType<typeof vi.fn> };
  let router: Router;
  let navigateSpy: any;

  const mockProfile: UserProfile = {
    id: 42,
    name: 'Priya Sharma',
    email: 'priya.sharma@bankease.com',
    phone: '9876543210',
    role: 'ROLE_CUSTOMER',
    kycStatus: 'VERIFIED',
    createdAt: '2026-02-14T08:30:00Z'
  };

  beforeEach(async () => {
    profileServiceSpy = {
      getProfile: vi.fn().mockReturnValue(of(mockProfile)),
      updateProfile: vi.fn()
    };

    authServiceSpy = {
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
  });

  it('should create the Profile component and load profile on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(profileServiceSpy.getProfile).toHaveBeenCalled();
    expect(component.profile).toEqual(mockProfile);
  });

  describe('Display Real Backend Profile Data', () => {
    it('should display real customer data in the DOM', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('#profile-display-name')?.textContent).toContain('Priya Sharma');
      expect(compiled.querySelector('#profile-display-email')?.textContent).toContain('priya.sharma@bankease.com');
      expect(compiled.querySelector('#profile-role-badge')?.textContent).toContain('ROLE_CUSTOMER');
      expect(compiled.querySelector('#profile-kyc-badge')?.textContent).toContain('VERIFIED');

      expect(compiled.querySelector('#detail-name')?.textContent).toContain('Priya Sharma');
      expect(compiled.querySelector('#detail-email')?.textContent).toContain('priya.sharma@bankease.com');
      expect(compiled.querySelector('#detail-phone')?.textContent).toContain('9876543210');
      expect(compiled.querySelector('#detail-role')?.textContent).toContain('ROLE_CUSTOMER');
      expect(compiled.querySelector('#detail-kyc')?.textContent).toContain('VERIFIED');
    });

    it('should show fallback when phone is not provided', () => {
      profileServiceSpy.getProfile.mockReturnValue(of({ ...mockProfile, phone: undefined }));
      component.loadProfile();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#detail-phone')?.textContent).toContain('Not provided');
    });
  });

  describe('Profile Edit & Form Validation', () => {
    it('should toggle edit mode open and closed', () => {
      fixture.detectChanges();
      expect(component.isEditing).toBe(false);

      const editBtn = fixture.nativeElement.querySelector('#btn-edit-profile') as HTMLButtonElement;
      expect(editBtn).toBeTruthy();
      editBtn.click();
      fixture.detectChanges();

      expect(component.isEditing).toBe(true);
      expect(fixture.nativeElement.querySelector('#profile-edit-form')).toBeTruthy();

      const cancelBtn = fixture.nativeElement.querySelector('#btn-cancel-edit') as HTMLButtonElement;
      cancelBtn.click();
      fixture.detectChanges();

      expect(component.isEditing).toBe(false);
      expect(fixture.nativeElement.querySelector('#profile-edit-form')).toBeNull();
    });

    it('should validate name is required and minimum 2 characters', () => {
      fixture.detectChanges();
      component.toggleEdit();
      fixture.detectChanges();

      component.profileForm.controls['name'].setValue('');
      expect(component.profileForm.controls['name'].valid).toBe(false);
      expect(component.profileForm.controls['name'].errors?.['required']).toBe(true);

      component.profileForm.controls['name'].setValue('A');
      expect(component.profileForm.controls['name'].valid).toBe(false);
      expect(component.profileForm.controls['name'].errors?.['minlength']).toBeTruthy();

      component.profileForm.controls['name'].setValue('Priya S.');
      expect(component.profileForm.controls['name'].valid).toBe(true);
    });

    it('should validate phone pattern for Indian mobile numbers', () => {
      fixture.detectChanges();
      component.toggleEdit();
      fixture.detectChanges();

      component.profileForm.controls['phone'].setValue('12345');
      expect(component.profileForm.controls['phone'].valid).toBe(false);

      component.profileForm.controls['phone'].setValue('9876543210');
      expect(component.profileForm.controls['phone'].valid).toBe(true);
    });

    it('should successfully update profile and display success message', () => {
      const updatedProfile: UserProfile = {
        ...mockProfile,
        name: 'Priya Sharma-Verma',
        phone: '9811122233'
      };
      profileServiceSpy.updateProfile.mockReturnValue(of(updatedProfile));

      fixture.detectChanges();
      component.toggleEdit();
      fixture.detectChanges();

      component.profileForm.patchValue({
        name: 'Priya Sharma-Verma',
        phone: '9811122233'
      });

      component.onSaveProfile();
      fixture.detectChanges();

      expect(profileServiceSpy.updateProfile).toHaveBeenCalledWith({
        name: 'Priya Sharma-Verma',
        phone: '9811122233'
      });
      expect(component.isEditing).toBe(false);
      expect(component.profile?.name).toBe('Priya Sharma-Verma');
      expect(component.successMessage).toBe('Profile updated successfully!');
      expect(fixture.nativeElement.querySelector('#profile-success')?.textContent).toContain('Profile updated successfully!');
    });

    it('should prevent submission when form is invalid', () => {
      fixture.detectChanges();
      component.toggleEdit();
      fixture.detectChanges();

      component.profileForm.controls['name'].setValue('');
      component.onSaveProfile();

      expect(profileServiceSpy.updateProfile).not.toHaveBeenCalled();
    });

    it('should handle update error and display friendly error message', () => {
      profileServiceSpy.updateProfile.mockReturnValue(throwError(() => ({
        error: { error: 'Invalid phone number format' }
      })));

      fixture.detectChanges();
      component.toggleEdit();
      fixture.detectChanges();

      component.profileForm.patchValue({
        name: 'Valid Name',
        phone: '9876543210'
      });

      component.onSaveProfile();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Invalid phone number format');
      expect(fixture.nativeElement.querySelector('#profile-error')).toBeTruthy();
    });
  });

  describe('Loading, Error, and Retry States', () => {
    it('should display loading state while fetching profile', () => {
      const subject = new Subject<UserProfile>();
      profileServiceSpy.getProfile.mockReturnValue(subject);
      component.loadProfile();
      fixture.detectChanges();

      const loadingEl = fixture.nativeElement.querySelector('#profile-loading');
      expect(loadingEl).toBeTruthy();
      expect(loadingEl.textContent).toContain('Loading customer profile...');

      subject.next(mockProfile);
      subject.complete();
      fixture.detectChanges();
    });

    it('should display error message and retry button when profile fetch fails', () => {
      profileServiceSpy.getProfile.mockReturnValue(throwError(() => new Error('Server error')));
      component.loadProfile();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Unable to load profile. Please try again.');
      const errorEl = fixture.nativeElement.querySelector('#profile-error');
      expect(errorEl).toBeTruthy();

      const retryBtn = fixture.nativeElement.querySelector('#btn-profile-retry') as HTMLButtonElement;
      expect(retryBtn).toBeTruthy();

      profileServiceSpy.getProfile.mockReturnValue(of(mockProfile));
      retryBtn.click();
      fixture.detectChanges();

      expect(profileServiceSpy.getProfile).toHaveBeenCalled();
      expect(component.profile).toEqual(mockProfile);
    });

    it('should dismiss alert messages when dismiss button is clicked', () => {
      profileServiceSpy.getProfile.mockReturnValue(throwError(() => new Error('Temporary error')));
      component.loadProfile();
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector('.btn-alert-close') as HTMLButtonElement;
      expect(closeBtn).toBeTruthy();
      closeBtn.click();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('');
      expect(fixture.nativeElement.querySelector('#profile-error')).toBeNull();
    });
  });

  describe('Logout & Navigation', () => {
    it('should call AuthService.logout and navigate to /login on logout', () => {
      fixture.detectChanges();
      const logoutBtn = fixture.nativeElement.querySelector('#logout-button') as HTMLButtonElement;
      expect(logoutBtn).toBeTruthy();

      logoutBtn.click();
      expect(authServiceSpy.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
