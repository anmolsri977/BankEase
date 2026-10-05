import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  BillPaymentService,
  BillPayment,
  BillPaymentRequest
} from './bill-payment.service';

describe('BillPaymentService', () => {
  let service: BillPaymentService;
  let httpTestingController: HttpTestingController;

  const mockBillPayments: BillPayment[] = [
    {
      id: 1,
      paymentId: 'BILL1700000001',
      billType: 'ELECTRICITY',
      billerName: 'Tata Power',
      billNumber: 'ELC998877',
      amount: 2450.0,
      status: 'SUCCESS',
      description: 'Monthly electricity bill',
      createdAt: '2026-03-25T14:30:00',
      paymentDate: '2026-03-25T14:30:00',
      account: {
        id: 10,
        accountNumber: '100234891234'
      }
    },
    {
      id: 2,
      paymentId: 'BILL1700000002',
      billType: 'INTERNET',
      billerName: 'Airtel Broadband',
      billNumber: 'FIBER12345',
      amount: 999.0,
      status: 'SUCCESS',
      description: 'Fiber subscription',
      createdAt: '2026-03-28T16:00:00',
      paymentDate: '2026-03-28T16:00:00',
      account: {
        id: 10,
        accountNumber: '100234891234'
      }
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BillPaymentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(BillPaymentService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process bill payment via POST /api/bill-payments/pay', () => {
    const request: BillPaymentRequest = {
      accountNumber: '100234891234',
      billType: 'ELECTRICITY',
      billerName: 'Tata Power',
      billNumber: 'ELC998877',
      amount: 2450.0,
      description: 'Monthly electricity bill'
    };

    const expectedResponse: BillPayment = mockBillPayments[0];

    service.payBill(request).subscribe((payment) => {
      expect(payment).toEqual(expectedResponse);
    });

    const req = httpTestingController.expectOne('/api/bill-payments/pay');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(expectedResponse, { status: 201, statusText: 'Created' });
  });

  it('should fetch customer bill payment history via GET /api/bill-payments/my', () => {
    service.getMyBillPayments().subscribe((payments) => {
      expect(payments.length).toBe(2);
      expect(payments).toEqual(mockBillPayments);
    });

    const req = httpTestingController.expectOne('/api/bill-payments/my');
    expect(req.request.method).toBe('GET');
    req.flush(mockBillPayments);
  });

  it('should fetch bill payment by id via GET /api/bill-payments/{id}', () => {
    const singlePayment = mockBillPayments[0];

    service.getBillPaymentById(1).subscribe((payment) => {
      expect(payment).toEqual(singlePayment);
    });

    const req = httpTestingController.expectOne('/api/bill-payments/1');
    expect(req.request.method).toBe('GET');
    req.flush(singlePayment);
  });

  it('should propagate error when bill payment API call fails', () => {
    let errorResponse: any;

    service.payBill({
      accountNumber: '100234891234',
      billType: 'WATER',
      billerName: 'Municipal Corp',
      billNumber: 'WAT112233',
      amount: 500
    }).subscribe({
      next: () => {
        throw new Error('expected call to fail');
      },
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpTestingController.expectOne('/api/bill-payments/pay');
    req.flush({ error: 'Insufficient balance in account' }, { status: 400, statusText: 'Bad Request' });

    expect(errorResponse.status).toBe(400);
    expect(errorResponse.error.error).toBe('Insufficient balance in account');
  });
});
