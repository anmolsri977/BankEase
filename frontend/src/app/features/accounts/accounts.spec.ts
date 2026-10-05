import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Accounts } from './accounts';
import { Account, AccountService } from './account.service';

describe('Accounts Component', () => {
  let component: Accounts;
  let fixture: ComponentFixture<Accounts>;
  let accountServiceSpy: {
    getMyAccounts: ReturnType<typeof vi.fn>;
    createAccount: ReturnType<typeof vi.fn>;
    getAccountById: ReturnType<typeof vi.fn>;
  };

  const mockAccounts: Account[] = [
    {
      id: 1,
      accountNumber: '100234891234',
      accountType: 'SAVINGS',
      balance: 75000.0,
      status: 'ACTIVE',
      createdAt: '2026-03-10T09:00:00',
      user: {
        id: 10,
        name: 'Anita Verma',
        email: 'anita.verma@bankease.com'
      }
    },
    {
      id: 2,
      accountNumber: '200876543210',
      accountType: 'CURRENT',
      balance: 25000.0,
      status: 'ACTIVE',
      createdAt: '2026-03-15T14:30:00'
    }
  ];

  beforeEach(async () => {
    accountServiceSpy = {
      getMyAccounts: vi.fn().mockReturnValue(of(mockAccounts)),
      createAccount: vi.fn(),
      getAccountById: vi.fn().mockReturnValue(of(mockAccounts[0]))
    };

    await TestBed.configureTestingModule({
      imports: [Accounts],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Accounts);
    component = fixture.componentInstance;
  });

  it('should create the Accounts component and load accounts on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(accountServiceSpy.getMyAccounts).toHaveBeenCalled();
    expect(component.accounts.length).toBe(2);
    expect(component.totalBalance).toBe(100000.0);
    expect(component.activeAccountsCount).toBe(2);
  });

  describe('Component Rendering & Data Display', () => {
    it('should render account cards with account number, type, balance, and status', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const card1 = compiled.querySelector('#account-card-1');
      expect(card1).toBeTruthy();
      expect(card1?.textContent).toContain('SAVINGS');
      expect(card1?.textContent).toContain('100234891234');
      expect(card1?.textContent).toContain('ACTIVE');

      const card2 = compiled.querySelector('#account-card-2');
      expect(card2).toBeTruthy();
      expect(card2?.textContent).toContain('CURRENT');
      expect(card2?.textContent).toContain('200876543210');
    });

    it('should render loading state while retrieving accounts', () => {
      const subject = new Subject<Account[]>();
      accountServiceSpy.getMyAccounts.mockReturnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      const loadingEl = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingEl).toBeTruthy();
      expect(loadingEl.textContent).toContain('Loading your accounts...');

      subject.next(mockAccounts);
      subject.complete();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeNull();
    });

    it('should render empty state when no accounts exist', () => {
      accountServiceSpy.getMyAccounts.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.accounts.length).toBe(0);
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No Accounts Found');
    });
  });

  describe('Account Creation', () => {
    it('should toggle create account form visibility', () => {
      fixture.detectChanges();
      expect(component.showCreateForm).toBe(false);
      expect(fixture.nativeElement.querySelector('#create-account-card')).toBeNull();

      component.toggleCreateForm();
      fixture.detectChanges();

      expect(component.showCreateForm).toBe(true);
      expect(fixture.nativeElement.querySelector('#create-account-card')).toBeTruthy();
    });

    it('should create an account successfully and prepend it to the accounts list', () => {
      const newAccount: Account = {
        id: 3,
        accountNumber: '300998877665',
        accountType: 'CURRENT',
        balance: 0.0,
        status: 'ACTIVE',
        createdAt: '2026-10-02T12:00:00'
      };

      accountServiceSpy.createAccount.mockReturnValue(of(newAccount));
      fixture.detectChanges();

      component.showCreateForm = true;
      component.selectedAccountType = 'CURRENT';
      fixture.detectChanges();

      component.onCreateAccount();
      fixture.detectChanges();

      expect(accountServiceSpy.createAccount).toHaveBeenCalledWith({ accountType: 'CURRENT' });
      expect(component.accounts.length).toBe(3);
      expect(component.accounts[0].accountNumber).toBe('300998877665');
      expect(component.successMessage).toContain('Account 300998877665 created successfully!');
      expect(component.showCreateForm).toBe(false);
      expect(component.isCreating).toBe(false);
    });

    it('should prevent duplicate submissions while account creation is in flight', () => {
      const subject = new Subject<Account>();
      accountServiceSpy.createAccount.mockReturnValue(subject.asObservable());

      fixture.detectChanges();
      component.showCreateForm = true;
      component.onCreateAccount();
      fixture.detectChanges();

      expect(component.isCreating).toBe(true);
      expect(accountServiceSpy.createAccount).toHaveBeenCalledTimes(1);

      // Attempt second submission while in progress
      component.onCreateAccount();
      expect(accountServiceSpy.createAccount).toHaveBeenCalledTimes(1);

      subject.next({
        id: 4,
        accountNumber: '400112233445',
        accountType: 'SAVINGS',
        balance: 0,
        status: 'ACTIVE'
      });
      subject.complete();
      fixture.detectChanges();

      expect(component.isCreating).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should display a friendly error message when account retrieval fails', () => {
      accountServiceSpy.getMyAccounts.mockReturnValue(
        throwError(() => new Error('org.hibernate.exception.JDBCConnectionException: Connection refused'))
      );

      fixture.detectChanges();

      expect(component.accounts.length).toBe(0);
      expect(component.errorMessage).toBe('Unable to load accounts. Please try again later.');
      expect(component.errorMessage).not.toContain('org.hibernate');

      const alert = fixture.nativeElement.querySelector('.alert-error');
      expect(alert?.textContent).toContain('Unable to load accounts. Please try again later.');
    });

    it('should display a friendly error message when account creation fails', () => {
      accountServiceSpy.createAccount.mockReturnValue(
        throwError(() => new Error('Internal Server Error: DB write failure'))
      );

      fixture.detectChanges();
      component.showCreateForm = true;
      component.onCreateAccount();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Failed to create account. Please try again.');
      expect(component.errorMessage).not.toContain('Internal Server Error');
      expect(component.isCreating).toBe(false);
    });

    it('should dismiss alert messages when close button is clicked', () => {
      accountServiceSpy.getMyAccounts.mockReturnValue(throwError(() => new Error('Failed to load')));
      component.loadAccounts();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.alert-error')).toBeTruthy();
      expect(component.errorMessage).toBe('Unable to load accounts. Please try again later.');

      const closeBtn = fixture.nativeElement.querySelector('.btn-alert-close') as HTMLButtonElement;
      expect(closeBtn).toBeTruthy();
      closeBtn.click();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('');
      expect(fixture.nativeElement.querySelector('.alert-error')).toBeNull();
    });
  });

  describe('Account Details View & Modal', () => {
    it('should fetch and display full account details in modal when view button is clicked', () => {
      fixture.detectChanges();

      const viewBtn = fixture.nativeElement.querySelector('#btn-view-acc-1') as HTMLButtonElement;
      expect(viewBtn).toBeTruthy();
      viewBtn.click();
      fixture.detectChanges();

      expect(accountServiceSpy.getAccountById).toHaveBeenCalledWith(1);
      expect(component.selectedAccount).toEqual(mockAccounts[0]);

      const modal = fixture.nativeElement.querySelector('#account-details-modal');
      expect(modal).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#modal-acc-number')?.textContent).toContain('100234891234');
      expect(fixture.nativeElement.querySelector('#modal-acc-type')?.textContent).toContain('SAVINGS');
      expect(fixture.nativeElement.querySelector('#modal-acc-balance')?.textContent).toContain('75,000.00');
      expect(fixture.nativeElement.querySelector('#modal-acc-holder')?.textContent).toContain('Anita Verma');
      expect(fixture.nativeElement.querySelector('#modal-acc-email')?.textContent).toContain('anita.verma@bankease.com');
    });

    it('should close account details modal when back button is clicked', () => {
      fixture.detectChanges();
      component.viewAccountDetails(mockAccounts[0]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('#account-details-modal')).toBeTruthy();

      const backBtn = fixture.nativeElement.querySelector('#btn-back-acc-details') as HTMLButtonElement;
      expect(backBtn).toBeTruthy();
      backBtn.click();
      fixture.detectChanges();

      expect(component.selectedAccount).toBeNull();
      expect(fixture.nativeElement.querySelector('#account-details-modal')).toBeNull();
    });

    it('should handle error when fetching account details fails', () => {
      accountServiceSpy.getAccountById.mockReturnValue(
        throwError(() => ({ error: { error: 'Access denied: Account does not belong to you' } }))
      );

      fixture.detectChanges();
      component.viewAccountDetails(mockAccounts[0]);
      fixture.detectChanges();

      expect(component.detailsError).toBe('Access denied: Account does not belong to you');
      const errBox = fixture.nativeElement.querySelector('#modal-acc-error');
      expect(errBox).toBeTruthy();
      expect(errBox.textContent).toContain('Access denied');
    });
  });
});
