import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NavbarComponent } from './navbar';
import { AuthService } from '../../../core/services/auth.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceSpy: { logout: ReturnType<typeof vi.fn>; getToken: ReturnType<typeof vi.fn> };
  let router: Router;
  let navigateSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      logout: vi.fn(),
      getToken: vi.fn().mockReturnValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  it('should create NavbarComponent', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render all 9 authenticated navigation items', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.navbar-nav .nav-link');
    expect(navLinks.length).toBe(9);

    expect(compiled.querySelector('#nav-dashboard')).toBeTruthy();
    expect(compiled.querySelector('#nav-accounts')).toBeTruthy();
    expect(compiled.querySelector('#nav-transactions')).toBeTruthy();
    expect(compiled.querySelector('#nav-beneficiaries')).toBeTruthy();
    expect(compiled.querySelector('#nav-bill-payments')).toBeTruthy();
    expect(compiled.querySelector('#nav-loans')).toBeTruthy();
    expect(compiled.querySelector('#nav-investments')).toBeTruthy();
    expect(compiled.querySelector('#nav-audit-logs')).toBeTruthy();
    expect(compiled.querySelector('#nav-profile')).toBeTruthy();
  });

  it('should toggle mobile menu open and closed', () => {
    fixture.detectChanges();
    expect(component.isMobileMenuOpen).toBe(false);

    const toggleBtn = fixture.nativeElement.querySelector('#btn-mobile-menu-toggle') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.isMobileMenuOpen).toBe(true);
    expect(fixture.nativeElement.querySelector('.navbar-nav.mobile-open')).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.isMobileMenuOpen).toBe(false);
  });

  it('should call AuthService.logout and navigate to /login when logout button is clicked', () => {
    fixture.detectChanges();
    const logoutBtn = fixture.nativeElement.querySelector('#logout-button') as HTMLButtonElement;
    expect(logoutBtn).toBeTruthy();

    logoutBtn.click();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should resolve customer name and role from token claims if present', () => {
    const payload = btoa(JSON.stringify({ name: 'Vikram Singh', role: 'ROLE_CUSTOMER' }));
    authServiceSpy.getToken.mockReturnValue(`header.${payload}.sig`);

    const freshFixture = TestBed.createComponent(NavbarComponent);
    const freshComp = freshFixture.componentInstance;
    freshFixture.detectChanges();

    expect(freshComp.customerName).toBe('Vikram Singh');
    expect(freshComp.userRole).toBe('CUSTOMER');
  });
});
