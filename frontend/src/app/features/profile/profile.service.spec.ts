import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfileService, UserProfile, UpdateProfileRequest } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpTesting: HttpTestingController;

  const mockProfile: UserProfile = {
    id: 1,
    name: 'Suresh Kumar',
    email: 'suresh.kumar@bankease.com',
    phone: '9876543210',
    role: 'ROLE_CUSTOMER',
    kycStatus: 'VERIFIED',
    createdAt: '2026-01-10T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProfileService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch user profile with GET /api/users/profile', () => {
    service.getProfile().subscribe((profile) => {
      expect(profile).toEqual(mockProfile);
      expect(profile.name).toBe('Suresh Kumar');
      expect(profile.role).toBe('ROLE_CUSTOMER');
    });

    const req = httpTesting.expectOne('/api/users/profile');
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('should update user profile with PUT /api/users/profile', () => {
    const updateReq: UpdateProfileRequest = {
      name: 'Suresh K.',
      phone: '9123456780'
    };

    const updatedProfile: UserProfile = {
      ...mockProfile,
      name: 'Suresh K.',
      phone: '9123456780'
    };

    service.updateProfile(updateReq).subscribe((profile) => {
      expect(profile.name).toBe('Suresh K.');
      expect(profile.phone).toBe('9123456780');
    });

    const req = httpTesting.expectOne('/api/users/profile');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush(updatedProfile);
  });

  it('should propagate error when profile fetch fails', () => {
    let errorResponse: any;
    let successCalled = false;

    service.getProfile().subscribe({
      next: () => { successCalled = true; },
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpTesting.expectOne('/api/users/profile');
    req.flush({ error: 'User not found' }, { status: 404, statusText: 'Not Found' });

    expect(successCalled).toBe(false);
    expect(errorResponse.status).toBe(404);
  });
});
