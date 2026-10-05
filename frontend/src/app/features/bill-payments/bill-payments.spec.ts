import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { BillPayments } from './bill-payments';
import { BillPayment, BillPaymentRequest, BillPaymentService } from './bill-payment.service';
import { Account, AccountService } from '../accounts/account.service';

describe('BillPayments Component', () => {
  let component: BillPayments;
  let fixture: ComponentFixture<BillPayments>;
  let billPaymentServiceSpy: {
    payBill: ReturnType<typeof vi.fn>;
    getMyBillPayments: ReturnType<typeof vi.fn>;
    getBillPaymentById: ReturnType<typeof vi.fn>;
  };
  let accountServiceSpy: {
    getMyAccounts: ReturnType<typeof vi.fn>;
  };

  const mockAccounts: Account[] = [
    {
      id: 1,
      accountNumber: '100234891234',
      accountType: 'SAVINGS',
      balance: 50000.0,
      status: 'ACTIVE'
    },
    {
      id: 2,
      accountNumber: '200876543210',
      accountType: 'CURRENT',
      balance: 10000.0,
      status: 'ACTIVE'
    }
  ];

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
        id: 1,
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
        id: 1,
        accountNumber: '100234891234'
      }
    }
  ];

  beforeEach(async () => {
    billPaymentServiceSpy = {
      payBill: vi.fn(),
      getMyBillPayments: vi.fn().mockReturnValue(of(mockBillPayments)),
      getBillPaymentById: vi.fn()
    };

    accountServiceSpy = {
      getMyAccounts: vi.fn().mockReturnValue(of(mockAccounts))
    };

    await TestBed.configureTestingModule({
      imports: [BillPayments],
      providers: [
        { provide: BillPaymentService, useValue: billPaymentServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BillPayments);
    component = fixture.componentInstance;
  });

  it('should create the BillPayments component and load accounts and bill payments on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(accountServiceSpy.getMyAccounts).toHaveBeenCalled();
    expect(billPaymentServiceSpy.getMyBillPayments).toHaveBeenCalled();
    expect(component.billPayments.length).toBe(2);
    expect(component.userAccounts.length).toBe(2);
    expect(component.accountNumber?.value).toBe('100234891234');
    expect(component.totalPaidAmount).toBe(3449.0);
    expect(component.successfulPaymentsCount).toBe(2);
  });

  describe('Component Rendering & Data Display', () => {
    it('should render bill payment history table with backend fields', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const row1 = compiled.querySelector('#bill-row-1');
      expect(row1).toBeTruthy();
      expect(row1?.textContent).toContain('BILL1700000001');
      expect(row1?.textContent).toContain('ELECTRICITY');
      expect(row1?.textContent).toContain('Tata Power');
      expect(row1?.textContent).toContain('ELC998877');
      expect(row1?.textContent).toContain('100234891234');
      expect(row1?.textContent).toContain('2,450.00');
      expect(row1?.textContent).toContain('SUCCESS');

      const row2 = compiled.querySelector('#bill-row-2');
      expect(row2).toBeTruthy();
      expect(row2?.textContent).toContain('BILL1700000002');
      expect(row2?.textContent).toContain('INTERNET');
      expect(row2?.textContent).toContain('Airtel Broadband');
      expect(row2?.textContent).toContain('999.00');
    });

    it('should render loading state while retrieving bill payments', () => {
      const subject = new Subject<BillPayment[]>();
      billPaymentServiceSpy.getMyBillPayments.mockReturnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      const loadingEl = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingEl).toBeTruthy();
      expect(loadingEl.textContent).toContain('Loading bill payment records...');

      subject.next(mockBillPayments);
      subject.complete();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeNull();
    });

    it('should render empty state when no bill payments exist', () => {
      billPaymentServiceSpy.getMyBillPayments.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.billPayments.length).toBe(0);
      const emptyEl = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyEl).toBeTruthy();
      expect(emptyEl.textContent).toContain('No Bill Payments Found');
    });

    it('should show user-friendly error message if history retrieval fails', () => {
      billPaymentServiceSpy.getMyBillPayments.mockReturnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Unable to load bill payment history. Please try again later.');
      const alertEl = fixture.nativeElement.querySelector('.alert-error');
      expect(alertEl).toBeTruthy();
      expect(alertEl.textContent).toContain('Unable to load bill payment history');
    });
  });

  describe('Category Selection & Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update billType when category button is clicked', () => {
      const waterBtn = fixture.nativeElement.querySelector('#cat-btn-WATER') as HTMLButtonElement;
      expect(waterBtn).toBeTruthy();

      waterBtn.click();
      fixture.detectChanges();

      expect(component.billType?.value).toBe('WATER');
      expect(waterBtn.classList.contains('selected')).toBe(true);
    });

    it('should validate required fields', () => {
      component.paymentForm.reset();
      expect(component.paymentForm.valid).toBe(false);

      component.paymentForm.patchValue({
        accountNumber: '100234891234',
        billType: 'ELECTRICITY',
        billerName: 'T', // Too short (< 2)
        billNumber: '',
        amount: 0 // <= 0
      });
      expect(component.paymentForm.valid).toBe(false);

      component.paymentForm.patchValue({
        billerName: 'Tata Power',
        billNumber: 'ELC998877',
        amount: 1500
      });
      expect(component.paymentForm.valid).toBe(true);
    });

    it('should mark fields as touched and show error message on invalid submit', () => {
      component.paymentForm.reset();
      component.onSubmitPayment();
      fixture.detectChanges();

      expect(billPaymentServiceSpy.payBill).not.toHaveBeenCalled();
      expect(component.accountNumber?.touched).toBe(true);
      expect(component.errorMessage).toContain('Please complete all required fields');
    });
  });

  describe('Payment Submission & State Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.paymentForm.patchValue({
        accountNumber: '100234891234',
        billType: 'ELECTRICITY',
        billerName: 'Tata Power',
        billNumber: 'ELC998877',
        amount: 1500,
        description: 'Office power bill'
      });
    });

    it('should prevent duplicate submissions while payment is in progress', () => {
      const subject = new Subject<BillPayment>();
      billPaymentServiceSpy.payBill.mockReturnValue(subject.asObservable());

      component.onSubmitPayment();
      expect(component.isSubmitting).toBe(true);
      expect(billPaymentServiceSpy.payBill).toHaveBeenCalledTimes(1);

      // Attempt second submission
      component.onSubmitPayment();
      expect(billPaymentServiceSpy.payBill).toHaveBeenCalledTimes(1);

      const created: BillPayment = {
        id: 3,
        paymentId: 'BILL1700000003',
        billType: 'ELECTRICITY',
        billerName: 'Tata Power',
        billNumber: 'ELC998877',
        amount: 1500,
        status: 'SUCCESS',
        account: { accountNumber: '100234891234' }
      };
      subject.next(created);
      subject.complete();

      expect(component.isSubmitting).toBe(false);
    });

    it('should successfully submit bill payment, prepend to history, and show success message', () => {
      const createdPayment: BillPayment = {
        id: 3,
        paymentId: 'BILL1700000003',
        billType: 'ELECTRICITY',
        billerName: 'Tata Power',
        billNumber: 'ELC998877',
        amount: 1500,
        status: 'SUCCESS',
        description: 'Office power bill',
        createdAt: '2026-10-02T13:00:00',
        paymentDate: '2026-10-02T13:00:00',
        account: { accountNumber: '100234891234' }
      };
      billPaymentServiceSpy.payBill.mockReturnValue(of(createdPayment));

      component.onSubmitPayment();
      fixture.detectChanges();

      const expectedPayload: BillPaymentRequest = {
        accountNumber: '100234891234',
        billType: 'ELECTRICITY',
        billerName: 'Tata Power',
        billNumber: 'ELC998877',
        amount: 1500,
        description: 'Office power bill'
      };
      expect(billPaymentServiceSpy.payBill).toHaveBeenCalledWith(expectedPayload);
      expect(component.billPayments.length).toBe(3);
      expect(component.billPayments[0]).toEqual(createdPayment);
      expect(component.successMessage).toContain('Payment of ₹1500 to Tata Power (ELECTRICITY) was successful!');
      expect(component.successMessage).toContain('BILL1700000003');
    });

    it('should handle backend error on payment failure and display friendly error message', () => {
      billPaymentServiceSpy.payBill.mockReturnValue(
        throwError(() => ({
          error: { error: 'Insufficient balance in account' }
        }))
      );

      component.onSubmitPayment();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Insufficient balance in account');
      expect(component.isSubmitting).toBe(false);
      expect(component.billPayments.length).toBe(2);
    });
  });

  describe('Alerts & Messages', () => {
    it('should dismiss alert messages when dismissMessages() is called', () => {
      fixture.detectChanges();
      component.errorMessage = 'Some error';
      component.successMessage = 'Some success';
      fixture.detectChanges();

      component.dismissMessages();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
    });
  });
});
