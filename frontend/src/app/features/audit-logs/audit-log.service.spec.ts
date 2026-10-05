import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuditLogService, AuditLog } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let httpTestingController: HttpTestingController;

  const mockLogs: AuditLog[] = [
    {
      id: 1,
      action: 'LOAN_APPLIED',
      description: 'Applied for HOME loan of 5000000',
      timestamp: '2026-03-25T14:30:00',
      user: {
        id: 10,
        email: 'alex@example.com',
        name: 'Alex Morgan'
      }
    },
    {
      id: 2,
      action: 'BILL_PAYMENT',
      description: 'Paid 2450 to Tata Power (ELECTRICITY)',
      timestamp: '2026-03-25T15:00:00',
      user: {
        id: 10,
        email: 'alex@example.com',
        name: 'Alex Morgan'
      }
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuditLogService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuditLogService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch customer audit logs via GET /api/audit-logs/my', () => {
    service.getMyAuditLogs().subscribe((logs) => {
      expect(logs.length).toBe(2);
      expect(logs).toEqual(mockLogs);
    });

    const req = httpTestingController.expectOne('/api/audit-logs/my');
    expect(req.request.method).toBe('GET');
    req.flush(mockLogs);
  });

  it('should fetch all audit logs via GET /api/audit-logs (admin)', () => {
    service.getAllAuditLogs().subscribe((logs) => {
      expect(logs.length).toBe(2);
      expect(logs).toEqual(mockLogs);
    });

    const req = httpTestingController.expectOne('/api/audit-logs');
    expect(req.request.method).toBe('GET');
    req.flush(mockLogs);
  });

  it('should propagate error when audit log retrieval fails', () => {
    let errorResponse: any;

    service.getMyAuditLogs().subscribe({
      next: () => {
        throw new Error('expected call to fail');
      },
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpTestingController.expectOne('/api/audit-logs/my');
    req.flush({ error: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(errorResponse.status).toBe(500);
  });
});
