import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  TransactionService,
  Transaction,
  TransferRequest
} from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpTestingController: HttpTestingController;

  const mockTransaction: Transaction = {
    id: 1,
    transactionId: 'TXN171205000012345678',
    transactionType: 'TRANSFER',
    amount: 1500.0,
    description: 'Rent payment',
    status: 'SUCCESS',
    transactionDate: '2026-03-31T10:00:00',
    createdAt: '2026-03-31T10:00:00',
    senderAccount: {
      accountNumber: '100234891234',
      user: { email: 'customer@bankease.com' }
    },
    receiverAccount: {
      accountNumber: '200987654321',
      user: { email: 'landlord@bankease.com' }
    }
  };

  const mockTransactions: Transaction[] = [
    mockTransaction,
    {
      id: 2,
      transactionId: 'TXN171205000087654321',
      transactionType: 'TRANSFER',
      amount: 500.0,
      description: 'Dinner split',
      status: 'SUCCESS',
      transactionDate: '2026-03-30T20:30:00',
      createdAt: '2026-03-30T20:30:00',
      senderAccount: {
        accountNumber: '200987654321',
        user: { email: 'friend@bankease.com' }
      },
      receiverAccount: {
        accountNumber: '100234891234',
        user: { email: 'customer@bankease.com' }
      }
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TransactionService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(TransactionService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST request to /api/transactions/transfer with correct payload', () => {
    const transferReq: TransferRequest = {
      senderAccountNumber: '100234891234',
      receiverAccountNumber: '200987654321',
      amount: 1500.0,
      description: 'Rent payment'
    };

    service.transferFunds(transferReq).subscribe((res) => {
      expect(res).toEqual(mockTransaction);
    });

    const req = httpTestingController.expectOne('/api/transactions/transfer');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(transferReq);
    req.flush(mockTransaction, { status: 201, statusText: 'Created' });
  });

  it('should fetch customer transactions via GET /api/transactions/my', () => {
    service.getMyTransactions().subscribe((txns) => {
      expect(txns.length).toBe(2);
      expect(txns).toEqual(mockTransactions);
    });

    const req = httpTestingController.expectOne('/api/transactions/my');
    expect(req.request.method).toBe('GET');
    req.flush(mockTransactions);
  });

  it('should fetch transaction details by id via GET /api/transactions/{id}', () => {
    service.getTransactionById(1).subscribe((txn) => {
      expect(txn).toEqual(mockTransaction);
    });

    const req = httpTestingController.expectOne('/api/transactions/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockTransaction);
  });

  it('should handle API errors properly on failed transfer', () => {
    let errorResponse: any;

    service.transferFunds({
      senderAccountNumber: '100234891234',
      receiverAccountNumber: '200987654321',
      amount: 1000000.0,
      description: 'Excessive amount'
    }).subscribe({
      next: () => {
        throw new Error('expected transfer to fail');
      },
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpTestingController.expectOne('/api/transactions/transfer');
    req.flush({ error: 'Insufficient balance in sender account' }, { status: 400, statusText: 'Bad Request' });

    expect(errorResponse.status).toBe(400);
    expect(errorResponse.error.error).toBe('Insufficient balance in sender account');
  });
});
