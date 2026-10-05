import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { AuditLogs } from './audit-logs';
import { AuditLog, AuditLogService } from './audit-log.service';

describe('AuditLogs Component', () => {
  let component: AuditLogs;
  let fixture: ComponentFixture<AuditLogs>;
  let auditLogServiceSpy: {
    getMyAuditLogs: ReturnType<typeof vi.fn>;
    getAllAuditLogs: ReturnType<typeof vi.fn>;
  };

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
    },
    {
      id: 3,
      action: 'TRANSFER_SUCCESS',
      description: 'Transferred 5000 to Priya Patel',
      timestamp: '2026-03-26T10:00:00',
      user: {
        id: 10,
        email: 'alex@example.com',
        name: 'Alex Morgan'
      }
    }
  ];

  beforeEach(async () => {
    auditLogServiceSpy = {
      getMyAuditLogs: vi.fn().mockReturnValue(of(mockLogs)),
      getAllAuditLogs: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AuditLogs],
      providers: [
        { provide: AuditLogService, useValue: auditLogServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogs);
    component = fixture.componentInstance;
  });

  it('should create the AuditLogs component and load audit logs on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(auditLogServiceSpy.getMyAuditLogs).toHaveBeenCalled();
    expect(component.auditLogs.length).toBe(3);
    expect(component.filteredLogs.length).toBe(3);
    expect(component.availableActions).toContain('LOAN_APPLIED');
    expect(component.availableActions).toContain('BILL_PAYMENT');
  });

  describe('Component Rendering & Data Display', () => {
    it('should render audit log rows with action, description, timestamp, and user details', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const row1 = compiled.querySelector('#log-row-1');
      expect(row1).toBeTruthy();
      expect(row1?.textContent).toContain('LOAN_APPLIED');
      expect(row1?.textContent).toContain('Applied for HOME loan of 5000000');
      expect(row1?.textContent).toContain('alex@example.com');

      const row2 = compiled.querySelector('#log-row-2');
      expect(row2).toBeTruthy();
      expect(row2?.textContent).toContain('BILL_PAYMENT');
      expect(row2?.textContent).toContain('Paid 2450 to Tata Power');
    });

    it('should render loading state while retrieving audit logs', () => {
      const subject = new Subject<AuditLog[]>();
      auditLogServiceSpy.getMyAuditLogs.mockReturnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      const loadingEl = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingEl).toBeTruthy();
      expect(loadingEl.textContent).toContain('Loading audit log trail...');

      subject.next(mockLogs);
      subject.complete();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeNull();
    });

    it('should render empty state when no audit logs exist', () => {
      auditLogServiceSpy.getMyAuditLogs.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.auditLogs.length).toBe(0);
      const emptyEl = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyEl).toBeTruthy();
      expect(emptyEl.textContent).toContain('No Audit Records Found');
    });

    it('should show user-friendly error message if log retrieval fails', () => {
      auditLogServiceSpy.getMyAuditLogs.mockReturnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Unable to load security audit logs. Please try again later.');
      const alertEl = fixture.nativeElement.querySelector('.alert-error');
      expect(alertEl).toBeTruthy();
      expect(alertEl.textContent).toContain('Unable to load security audit logs');
    });
  });

  describe('Filtering & Searching', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter logs by text search query', () => {
      component.filterQuery = 'Tata Power';
      expect(component.filteredLogs.length).toBe(1);
      expect(component.filteredLogs[0].action).toBe('BILL_PAYMENT');

      component.filterQuery = 'nonexistent';
      expect(component.filteredLogs.length).toBe(0);
    });

    it('should filter logs by selected action pill', () => {
      component.selectedActionFilter = 'LOAN_APPLIED';
      expect(component.filteredLogs.length).toBe(1);
      expect(component.filteredLogs[0].action).toBe('LOAN_APPLIED');

      component.selectedActionFilter = 'ALL';
      expect(component.filteredLogs.length).toBe(3);
    });
  });

  describe('Refresh & Dismiss', () => {
    it('should reload logs when refresh button is clicked', () => {
      fixture.detectChanges();
      const refreshBtn = fixture.nativeElement.querySelector('#btn-refresh-audit-logs') as HTMLButtonElement;
      expect(refreshBtn).toBeTruthy();

      refreshBtn.click();
      expect(auditLogServiceSpy.getMyAuditLogs).toHaveBeenCalledTimes(2);
    });

    it('should dismiss alert messages when dismissMessages() is called', () => {
      fixture.detectChanges();
      component.errorMessage = 'Some error';
      fixture.detectChanges();

      component.dismissMessages();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('');
    });
  });
});
