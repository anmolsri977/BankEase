import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  LoanService,
  Loan,
  ApplyLoanRequest,
  UpdateLoanStatusRequest
} from './loan.service';

describe('LoanService', () => {
  let service: LoanService;
  let httpTestingController: HttpTestingController;

  const mockLoans: Loan[] = [
    {
      id: 1,
      loanId: 'LOAN1700000001',
      loanType: 'HOME',
      amount: 5000000.0,
      interestRate: 8.5,
      tenureMonths: 240,
      status: 'PENDING',
      applicationDate: '2026-03-20T10:00:00'
    },
    {
      id: 2,
      loanId: 'LOAN1700000002',
      loanType: 'PERSONAL',
      amount: 200000.0,
      interestRate: 12.0,
      tenureMonths: 24,
      status: 'APPROVED',
      applicationDate: '2026-03-22T14:30:00',
      remarks: 'Credit score verified'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoanService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(LoanService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should apply for loan via POST /api/loans/apply', () => {
    const request: ApplyLoanRequest = {
      loanType: 'HOME',
      amount: 5000000.0,
      tenureMonths: 240
    };
    const expectedLoan: Loan = mockLoans[0];

    service.applyLoan(request).subscribe((loan) => {
      expect(loan).toEqual(expectedLoan);
    });

    const req = httpTestingController.expectOne('/api/loans/apply');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(expectedLoan, { status: 201, statusText: 'Created' });
  });

  it('should fetch authenticated customer loans via GET /api/loans/my', () => {
    service.getMyLoans().subscribe((loans) => {
      expect(loans.length).toBe(2);
      expect(loans).toEqual(mockLoans);
    });

    const req = httpTestingController.expectOne('/api/loans/my');
    expect(req.request.method).toBe('GET');
    req.flush(mockLoans);
  });

  it('should fetch single loan by id via GET /api/loans/{id}', () => {
    service.getLoanById(1).subscribe((loan) => {
      expect(loan).toEqual(mockLoans[0]);
    });

    const req = httpTestingController.expectOne('/api/loans/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockLoans[0]);
  });

  it('should fetch all loans via GET /api/loans (admin)', () => {
    service.getAllLoans().subscribe((loans) => {
      expect(loans.length).toBe(2);
    });

    const req = httpTestingController.expectOne('/api/loans');
    expect(req.request.method).toBe('GET');
    req.flush(mockLoans);
  });

  it('should update loan status via PUT /api/loans/{id}/status (admin)', () => {
    const statusUpdate: UpdateLoanStatusRequest = {
      status: 'APPROVED',
      remarks: 'Verified'
    };
    const updatedLoan: Loan = { ...mockLoans[0], status: 'APPROVED', remarks: 'Verified' };

    service.updateLoanStatus(1, statusUpdate).subscribe((loan) => {
      expect(loan).toEqual(updatedLoan);
    });

    const req = httpTestingController.expectOne('/api/loans/1/status');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(statusUpdate);
    req.flush(updatedLoan);
  });

  it('should propagate error when loan application fails', () => {
    let errorResponse: any;

    service.applyLoan({
      loanType: 'PERSONAL',
      amount: -100,
      tenureMonths: 12
    }).subscribe({
      next: () => {
        throw new Error('expected call to fail');
      },
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpTestingController.expectOne('/api/loans/apply');
    req.flush({ error: 'Loan amount must be greater than zero' }, { status: 400, statusText: 'Bad Request' });

    expect(errorResponse.status).toBe(400);
    expect(errorResponse.error.error).toBe('Loan amount must be greater than zero');
  });
});
