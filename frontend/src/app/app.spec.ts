import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { routes } from './app.routes';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Dashboard } from './dashboard/dashboard';
import { Accounts } from './features/accounts/accounts';
import { Transactions } from './features/transactions/transactions';
import { Beneficiaries } from './features/beneficiaries/beneficiaries';
import { BillPayments } from './features/bill-payments/bill-payments';
import { Loans } from './features/loans/loans';
import { Investments } from './features/investments/investments';
import { AuditLogs } from './features/audit-logs/audit-logs';
import { Profile } from './features/profile/profile';

describe('App & Root Routing', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app and contain a router-outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should render Login component at /login', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/login');
    expect(activatedComponent instanceof Login).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.brand-title')?.textContent).toContain('BankEase');
    expect(harness.routeNativeElement?.querySelector('button[type="submit"]')?.textContent).toContain('Login');
  });

  it('should render Register component at /register', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/register');
    expect(activatedComponent instanceof Register).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.brand-title')?.textContent).toContain('BankEase');
    expect(harness.routeNativeElement?.querySelector('button[type="submit"]')?.textContent).toContain('Register');
  });

  it('should redirect / to /login', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/');
    expect(activatedComponent instanceof Login).toBe(true);
  });

  it('should redirect /dashboard to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/dashboard');
    expect(activatedComponent instanceof Login).toBe(true);
  });

  it('should render Dashboard component at /dashboard when authenticated without NG04002', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/dashboard');
    expect(activatedComponent instanceof Dashboard).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.welcome-heading')?.textContent).toContain('Welcome back');
    expect(harness.routeNativeElement?.querySelector('.balance-card')).toBeTruthy();
  }, 15000);

  it('should redirect /accounts to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/accounts');
    expect(activatedComponent instanceof Login).toBe(true);
  }, 15000);

  it('should render Accounts component at /accounts when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/accounts');
    expect(activatedComponent instanceof Accounts).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.page-title')?.textContent).toContain('My Bank Accounts');
  }, 15000);

  it('should redirect /transactions to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/transactions');
    expect(activatedComponent instanceof Login).toBe(true);
  }, 15000);

  it('should render Transactions component at /transactions when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/transactions');
    expect(activatedComponent instanceof Transactions).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.page-title')?.textContent).toContain('Fund Transfer & Transactions');
  }, 15000);

  it('should redirect /beneficiaries to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/beneficiaries');
    expect(activatedComponent instanceof Login).toBe(true);
  }, 15000);

  it('should render Beneficiaries component at /beneficiaries when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/beneficiaries');
    expect(activatedComponent instanceof Beneficiaries).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.page-title')?.textContent).toContain('Beneficiary Management');
  }, 15000);

  it('should redirect /bill-payments to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/bill-payments');
    expect(activatedComponent instanceof Login).toBe(true);
  }, 15000);

  it('should render BillPayments component at /bill-payments when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/bill-payments');
    expect(activatedComponent instanceof BillPayments).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.page-title')?.textContent).toContain('Utility & Bill Payments');
  }, 15000);

  it('should redirect /loans to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/loans');
    expect(activatedComponent instanceof Login).toBe(true);
  }, 15000);

  it('should render Loans component at /loans when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/loans');
    expect(activatedComponent instanceof Loans).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.page-title')?.textContent).toContain('Loan Management');
  }, 15000);

  it('should redirect /investments to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/investments');
    expect(activatedComponent instanceof Login).toBe(true);
  }, 15000);

  it('should render Investments component at /investments when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/investments');
    expect(activatedComponent instanceof Investments).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.page-title')?.textContent).toContain('Investment Portfolio');
  }, 15000);

  it('should redirect /audit-logs to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/audit-logs');
    expect(activatedComponent instanceof Login).toBe(true);
  }, 15000);

  it('should render AuditLogs component at /audit-logs when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/audit-logs');
    expect(activatedComponent instanceof AuditLogs).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.page-title')?.textContent).toContain('Security & Audit Trail');
  }, 15000);

  it('should redirect /profile to /login when unauthenticated', async () => {
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/profile');
    expect(activatedComponent instanceof Login).toBe(true);
  }, 15000);

  it('should render Profile component at /profile when authenticated', async () => {
    localStorage.setItem('bankease_token', 'valid-test-token');
    const harness = await RouterTestingHarness.create();
    const activatedComponent = await harness.navigateByUrl('/profile');
    expect(activatedComponent instanceof Profile).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.page-title')?.textContent).toContain('Customer Profile');
  }, 15000);
});
