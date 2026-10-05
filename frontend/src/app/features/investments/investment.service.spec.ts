import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  InvestmentService,
  Investment,
  CreateInvestmentRequest,
  UpdateInvestmentStatusRequest
} from './investment.service';

describe('InvestmentService', () => {
  let service: InvestmentService;
  let httpTestingController: HttpTestingController;

  const mockInvestments: Investment[] = [
    {
      id: 1,
      investmentId: 'INV1700000001',
      investmentType: 'FD',
      amount: 100000.0,
      status: 'ACTIVE',
      investmentDate: '2026-03-01T10:00:00',
      maturityDate: '2027-03-01T10:00:00',
      returns: 7000.0
    },
    {
      id: 2,
      investmentId: 'INV1700000002',
      investmentType: 'MUTUAL_FUND',
      amount: 50000.0,
      status: 'ACTIVE',
      investmentDate: '2026-03-15T11:30:00',
      maturityDate: '2028-03-15T11:30:00',
      returns: 12000.0
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InvestmentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InvestmentService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an investment via POST /api/investments', () => {
    const request: CreateInvestmentRequest = {
      investmentType: 'FD',
      amount: 100000.0,
      tenureMonths: 12
    };
    const expectedInvestment: Investment = mockInvestments[0];

    service.createInvestment(request).subscribe((investment) => {
      expect(investment).toEqual(expectedInvestment);
    });

    const req = httpTestingController.expectOne('/api/investments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(expectedInvestment, { status: 201, statusText: 'Created' });
  });

  it('should fetch authenticated customer investments via GET /api/investments/my', () => {
    service.getMyInvestments().subscribe((investments) => {
      expect(investments.length).toBe(2);
      expect(investments).toEqual(mockInvestments);
    });

    const req = httpTestingController.expectOne('/api/investments/my');
    expect(req.request.method).toBe('GET');
    req.flush(mockInvestments);
  });

  it('should fetch single investment by id via GET /api/investments/{id}', () => {
    service.getInvestmentById(1).subscribe((investment) => {
      expect(investment).toEqual(mockInvestments[0]);
    });

    const req = httpTestingController.expectOne('/api/investments/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockInvestments[0]);
  });

  it('should fetch all investments via GET /api/investments (admin)', () => {
    service.getAllInvestments().subscribe((investments) => {
      expect(investments.length).toBe(2);
    });

    const req = httpTestingController.expectOne('/api/investments');
    expect(req.request.method).toBe('GET');
    req.flush(mockInvestments);
  });

  it('should update investment status via PUT /api/investments/{id}/status (admin)', () => {
    const statusUpdate: UpdateInvestmentStatusRequest = {
      status: 'MATURED'
    };
    const updatedInvestment: Investment = { ...mockInvestments[0], status: 'MATURED' };

    service.updateInvestmentStatus(1, statusUpdate).subscribe((investment) => {
      expect(investment).toEqual(updatedInvestment);
    });

    const req = httpTestingController.expectOne('/api/investments/1/status');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(statusUpdate);
    req.flush(updatedInvestment);
  });

  it('should propagate error when investment creation fails', () => {
    let errorResponse: any;

    service.createInvestment({
      investmentType: 'FD',
      amount: -50,
      tenureMonths: 12
    }).subscribe({
      next: () => {
        throw new Error('expected call to fail');
      },
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpTestingController.expectOne('/api/investments');
    req.flush({ error: 'Investment amount must be greater than zero' }, { status: 400, statusText: 'Bad Request' });

    expect(errorResponse.status).toBe(400);
    expect(errorResponse.error.error).toBe('Investment amount must be greater than zero');
  });
});
