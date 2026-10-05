import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dashboard } from './dashboard';
import { AuthService } from '../core/services/auth.service';
import { Account, AccountService } from '../features/accounts/account.service';
import { Transaction, TransactionService } from '../features/transactions/transaction.service';
import { routes } from '../app.routes';
import { authGuard } from '../core/guards/auth.guard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let authServiceSpy: { logout: ReturnType<typeof vi.fn>; getToken: ReturnType<typeof vi.fn> };
  let accountServiceSpy: { getMyAccounts: ReturnType<typeof vi.fn> };
  let transactionServiceSpy: { getMyTransactions: ReturnType<typeof vi.fn> };
  let router: Router;
  let navigateSpy: any;

  const mockAccounts: Account[] = [
    {
      id: 101,
      accountNumber: 'ACC-1001-99',
      accountType: 'SAVINGS',
      balance: 45000.5,
      status: 'ACTIVE',
      createdAt: '2026-01-15T10:00:00Z',
      user: {
        id: 1,
        name: 'Jane Doe',
        email: 'jane.doe@bankease.com'
      }
    },
    {
      id: 102,
      accountNumber: 'ACC-2002-88',
      accountType: 'CURRENT',
      balance: 15500.0,
      status: 'BLOCKED',
      createdAt: '2026-02-20T14:30:00Z',
      user: {
        id: 1,
        name: 'Jane Doe',
        email: 'jane.doe@bankease.com'
      }
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 1,
      transactionId: 'TXN-901',
      transactionType: 'TRANSFER',
      amount: 5000.0,
      description: 'Vendor payment',
      status: 'SUCCESS',
      createdAt: '2026-03-01T10:00:00Z',
      senderAccount: {
        id: 101,
        accountNumber: 'ACC-1001-99'
      },
      receiverAccount: {
        id: 205,
        accountNumber: 'ACC-EXT-555'
      }
    },
    {
      id: 2,
      transactionId: 'TXN-902',
      transactionType: 'TRANSFER',
      amount: 12000.0,
      description: 'Consulting revenue',
      status: 'SUCCESS',
      createdAt: '2026-03-02T12:00:00Z',
      senderAccount: {
        id: 301,
        accountNumber: 'ACC-EXT-888'
      },
      receiverAccount: {
        id: 101,
        accountNumber: 'ACC-1001-99'
      }
    }
  ];

  beforeEach(async () => {
    authServiceSpy = {
      logout: vi.fn(),
      getToken: vi.fn().mockReturnValue(null)
    };

    accountServiceSpy = {
      getMyAccounts: vi.fn().mockReturnValue(of(mockAccounts))
    };

    transactionServiceSpy = {
      getMyTransactions: vi.fn().mockReturnValue(of(mockTransactions))
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  // 1. Dashboard creation
  it('should create the dashboard component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // 2. Account API called on initialization
  it('should call AccountService.getMyAccounts on initialization', () => {
    fixture.detectChanges();
    expect(accountServiceSpy.getMyAccounts).toHaveBeenCalledTimes(1);
    expect(component.accounts.length).toBe(2);
  });

  // 3. Transaction API called on initialization
  it('should call TransactionService.getMyTransactions on initialization', () => {
    fixture.detectChanges();
    expect(transactionServiceSpy.getMyTransactions).toHaveBeenCalledTimes(1);
    expect(component.recentTransactions.length).toBe(2);
  });

  // 4. Real customer account data rendered
  it('should render real customer account data in the DOM', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const accountCards = compiled.querySelectorAll('.account-card');
    expect(accountCards.length).toBe(2);

    const firstCard = accountCards[0];
    expect(firstCard.textContent).toContain('SAVINGS');
    expect(firstCard.textContent).toContain('ACC-1001-99');
    expect(firstCard.textContent).toContain('45,000.50');
    expect(firstCard.textContent).toContain('ACTIVE');
  });

  // 5. Total balance calculated correctly
  it('should calculate total net balance as sum of account balances', () => {
    fixture.detectChanges();
    expect(component.totalBalance).toBe(60500.5);

    const balanceAmount = fixture.nativeElement.querySelector('.balance-amount');
    expect(balanceAmount?.textContent).toContain('60,500.50');
  });

  // 6. Account count calculated correctly
  it('should calculate total accounts count correctly', () => {
    fixture.detectChanges();
    expect(component.totalAccounts).toBe(2);

    const cardDetails = fixture.nativeElement.querySelector('.balance-card-details');
    expect(cardDetails?.textContent).toContain('2');
  });

  // 7. Active account count calculated correctly
  it('should calculate active accounts count correctly', () => {
    fixture.detectChanges();
    // 1 ACTIVE and 1 BLOCKED in mockAccounts
    expect(component.activeAccounts).toBe(1);
  });

  // 8. Real transaction data rendered
  it('should render real transaction data in recent transactions section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const txnItems = compiled.querySelectorAll('.transaction-item');
    expect(txnItems.length).toBe(2);

    expect(txnItems[0].textContent).toContain('Vendor payment');
    expect(txnItems[0].textContent).toContain('TXN-901');
  });

  // 9. Debit transaction displayed correctly
  it('should format and style debit transactions with negative sign when customer account is sender', () => {
    fixture.detectChanges();
    const firstTx = component.recentTransactions[0];
    expect(component.isDebit(firstTx)).toBe(true);
    expect(component.isCredit(firstTx)).toBe(false);

    const debitAmountEl = fixture.nativeElement.querySelector('#transaction-1 .amount-debit');
    expect(debitAmountEl).toBeTruthy();
    expect(debitAmountEl.textContent).toContain('-₹5,000.00');
  });

  // 10. Credit transaction displayed correctly
  it('should format and style credit transactions with positive sign when customer account is receiver', () => {
    fixture.detectChanges();
    const secondTx = component.recentTransactions[1];
    expect(component.isDebit(secondTx)).toBe(false);
    expect(component.isCredit(secondTx)).toBe(true);

    const creditAmountEl = fixture.nativeElement.querySelector('#transaction-2 .amount-credit');
    expect(creditAmountEl).toBeTruthy();
    expect(creditAmountEl.textContent).toContain('+₹12,000.00');
  });

  // 11. Latest transactions limited appropriately
  it('should limit dashboard recent transactions to the latest 5 activities', () => {
    const sevenTxns: Transaction[] = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      transactionId: `TXN-00${i + 1}`,
      transactionType: 'TRANSFER',
      amount: (i + 1) * 100,
      description: `Txn ${i + 1}`,
      status: 'SUCCESS',
      createdAt: `2026-03-0${i + 1}T10:00:00Z`
    }));

    transactionServiceSpy.getMyTransactions.mockReturnValue(of(sevenTxns));
    component.loadTransactions();
    fixture.detectChanges();

    expect(component.recentTransactions.length).toBe(5);
    expect(component.recentTransactions[0].transactionId).toBe('TXN-001');
    expect(component.recentTransactions[4].transactionId).toBe('TXN-005');
  });

  // 12. Empty accounts state
  it('should display empty accounts state when customer has no accounts', () => {
    accountServiceSpy.getMyAccounts.mockReturnValue(of([]));
    component.loadAccounts();
    fixture.detectChanges();

    expect(component.accounts.length).toBe(0);
    expect(component.totalBalance).toBe(0);
    expect(component.primaryAccountNumber).toBe('N/A');

    const emptySection = fixture.nativeElement.querySelector('#accounts-empty');
    expect(emptySection).toBeTruthy();
    expect(emptySection.textContent).toContain('No Accounts Found');
  });

  // 13. Empty transactions state
  it('should display empty transactions state when customer has no transactions', () => {
    transactionServiceSpy.getMyTransactions.mockReturnValue(of([]));
    component.loadTransactions();
    fixture.detectChanges();

    expect(component.recentTransactions.length).toBe(0);
    const emptySection = fixture.nativeElement.querySelector('#transactions-empty');
    expect(emptySection).toBeTruthy();
    expect(emptySection.textContent).toContain('No Recent Transactions');
  });

  // 14. Account API failure
  it('should display friendly error message when account loading fails', () => {
    accountServiceSpy.getMyAccounts.mockReturnValue(throwError(() => new Error('Server error')));
    component.loadAccounts();
    fixture.detectChanges();

    expect(component.accountsError).toBe('Unable to load your account information. Please try again.');
    const errorEl = fixture.nativeElement.querySelector('#accounts-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Unable to load your account information. Please try again.');
  });

  // 15. Transaction API failure
  it('should display friendly error message when transaction loading fails', () => {
    transactionServiceSpy.getMyTransactions.mockReturnValue(throwError(() => new Error('Server error')));
    component.loadTransactions();
    fixture.detectChanges();

    expect(component.transactionsError).toBe('Unable to load recent transactions. Please try again.');
    const errorEl = fixture.nativeElement.querySelector('#transactions-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Unable to load recent transactions. Please try again.');
  });

  // 16. Retry/refresh behavior
  it('should support retry and refresh actions when error occurs or refresh button clicked', () => {
    accountServiceSpy.getMyAccounts.mockReturnValue(throwError(() => new Error('Network error')));
    component.loadAccounts();
    fixture.detectChanges();

    expect(component.accountsError).toBeTruthy();

    // Now mock recovery and click retry
    accountServiceSpy.getMyAccounts.mockReturnValue(of(mockAccounts));
    const retryBtn = fixture.nativeElement.querySelector('#btn-retry-accounts') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();
    retryBtn.click();
    fixture.detectChanges();

    expect(component.accountsError).toBeNull();
    expect(component.accounts.length).toBe(2);

    // Test dashboard refresh button
    const refreshBtn = fixture.nativeElement.querySelector('#btn-refresh-dashboard') as HTMLButtonElement;
    expect(refreshBtn).toBeTruthy();
    refreshBtn.click();
    expect(accountServiceSpy.getMyAccounts).toHaveBeenCalled();
    expect(transactionServiceSpy.getMyTransactions).toHaveBeenCalled();
  });

  // 17. Quick action navigation
  it('should navigate to corresponding routes when quick actions are clicked', () => {
    fixture.detectChanges();

    const transferBtn = fixture.nativeElement.querySelector('#quick-action-transfer') as HTMLButtonElement;
    transferBtn.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/transactions']);

    const billsBtn = fixture.nativeElement.querySelector('#quick-action-bills') as HTMLButtonElement;
    billsBtn.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/bill-payments']);

    const beneficiaryBtn = fixture.nativeElement.querySelector('#quick-action-beneficiary') as HTMLButtonElement;
    beneficiaryBtn.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/beneficiaries']);

    const loanBtn = fixture.nativeElement.querySelector('#quick-action-loan') as HTMLButtonElement;
    loanBtn.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/loans']);

    const investBtn = fixture.nativeElement.querySelector('#quick-action-investments') as HTMLButtonElement;
    investBtn.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/investments']);
  });

  // 18. Logout behavior
  it('should call AuthService.logout and navigate to /login when logout button is clicked', () => {
    fixture.detectChanges();
    const logoutBtn = fixture.nativeElement.querySelector('#logout-button') as HTMLButtonElement;
    expect(logoutBtn).toBeTruthy();

    logoutBtn.click();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  // 19. Protected dashboard route remains protected
  it('should ensure dashboard route is protected with authGuard in app.routes', () => {
    const dashboardRoute = routes.find((r) => r.path === 'dashboard');
    expect(dashboardRoute).toBeDefined();
    expect(dashboardRoute?.canActivate).toContain(authGuard);
  });

  // 20. No hardcoded/mock customer data remains
  it('should ensure no hardcoded/mock customer data remains in the component', () => {
    // When instantiated with empty or default data, it must not hardcode Alex Morgan or 125450
    const testFixture = TestBed.createComponent(Dashboard);
    const testComp = testFixture.componentInstance;

    expect(testComp.customerName).not.toBe('Alex Morgan');
    expect(testComp.totalBalance).not.toBe(125450.0);
    expect(testComp.primaryAccountNumber).not.toBe('•••• •••• •••• 4589');
  });

  // Additional tests:
  it('should update customer name from account user info if returned', () => {
    fixture.detectChanges();
    expect(component.customerName).toBe('Jane Doe');
    const welcomeHeading = fixture.nativeElement.querySelector('.welcome-heading');
    expect(welcomeHeading.textContent).toContain('Welcome back, Jane Doe');
  });

  it('should resolve customer name from JWT token payload when present', () => {
    const tokenPayload = btoa(JSON.stringify({ name: 'Rahul Sharma', sub: 'rahul@example.com' }));
    authServiceSpy.getToken.mockReturnValue(`header.${tokenPayload}.signature`);

    const freshFixture = TestBed.createComponent(Dashboard);
    const freshComp = freshFixture.componentInstance;
    accountServiceSpy.getMyAccounts.mockReturnValue(of([]));
    freshFixture.detectChanges();

    expect(freshComp.customerName).toBe('Rahul Sharma');
  });

  it('should clear action notification banner if active', () => {
    fixture.detectChanges();
    component.showNotification('Test Notification');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.notification-banner');
    expect(banner).toBeTruthy();

    const closeBtn = fixture.nativeElement.querySelector('.btn-close-notification') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(component.actionNotification).toBe('');
    expect(fixture.nativeElement.querySelector('.notification-banner')).toBeNull();
  });
});
