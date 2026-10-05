import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountService, Account, CreateAccountRequest } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let httpTestingController: HttpTestingController;

  const mockAccounts: Account[] = [
    {
      id: 1,
      accountNumber: '100234891234',
      accountType: 'SAVINGS',
      balance: 50000.0,
      status: 'ACTIVE',
      createdAt: '2026-03-15T10:00:00'
    },
    {
      id: 2,
      accountNumber: '200987654321',
      accountType: 'CURRENT',
      balance: 120000.0,
      status: 'ACTIVE',
      createdAt: '2026-03-20T11:30:00'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AccountService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch authenticated customer accounts from GET /api/accounts/my', () => {
    service.getMyAccounts().subscribe((accounts) => {
      expect(accounts.length).toBe(2);
      expect(accounts).toEqual(mockAccounts);
    });

    const req = httpTestingController.expectOne('/api/accounts/my');
    expect(req.request.method).toBe('GET');
    req.flush(mockAccounts);
  });

  it('should fetch account by id from GET /api/accounts/{id}', () => {
    const singleAccount = mockAccounts[0];

    service.getAccountById(1).subscribe((account) => {
      expect(account).toEqual(singleAccount);
    });

    const req = httpTestingController.expectOne('/api/accounts/1');
    expect(req.request.method).toBe('GET');
    req.flush(singleAccount);
  });

  it('should create a new account via POST /api/accounts', () => {
    const newRequest: CreateAccountRequest = { accountType: 'SAVINGS' };
    const createdAccount: Account = {
      id: 3,
      accountNumber: '300112233445',
      accountType: 'SAVINGS',
      balance: 0.0,
      status: 'ACTIVE',
      createdAt: '2026-10-02T12:00:00'
    };

    service.createAccount(newRequest).subscribe((account) => {
      expect(account).toEqual(createdAccount);
    });

    const req = httpTestingController.expectOne('/api/accounts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newRequest);
    req.flush(createdAccount, { status: 201, statusText: 'Created' });
  });

  it('should propagate error when API call fails', () => {
    let errorResponse: any;

    service.getMyAccounts().subscribe({
      next: () => {
        throw new Error('expected call to fail');
      },
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpTestingController.expectOne('/api/accounts/my');
    req.flush({ error: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(errorResponse.status).toBe(500);
  });
});
