import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Loans } from './loans';
import { Loan, LoanService, ApplyLoanRequest } from './loan.service';

describe('Loans Component', () => {
  let component: Loans;
  let fixture: ComponentFixture<Loans>;
  let loanServiceSpy: {
    applyLoan: ReturnType<typeof vi.fn>;
    getMyLoans: ReturnType<typeof vi.fn>;
    getLoanById: ReturnType<typeof vi.fn>;
  };

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
      remarks: 'Verified'
    }
  ];

  beforeEach(async () => {
    loanServiceSpy = {
      applyLoan: vi.fn(),
      getMyLoans: vi.fn().mockReturnValue(of(mockLoans)),
      getLoanById: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Loans],
      providers: [
        { provide: LoanService, useValue: loanServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Loans);
    component = fixture.componentInstance;
  });

  it('should create the Loans component and load loans on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(loanServiceSpy.getMyLoans).toHaveBeenCalled();
    expect(component.loans.length).toBe(2);
    expect(component.totalLoanAmount).toBe(5200000.0);
    expect(component.activeLoansCount).toBe(1);
  });

  describe('Component Rendering & Data Display', () => {
    it('should render loan cards with loan ID, type, amount, interest rate, and status', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const card1 = compiled.querySelector('#loan-card-1');
      expect(card1).toBeTruthy();
      expect(card1?.textContent).toContain('LOAN1700000001');
      expect(card1?.textContent).toContain('HOME');
      expect(card1?.textContent).toContain('5,000,000');
      expect(card1?.textContent).toContain('8.5%');
      expect(card1?.textContent).toContain('PENDING');

      const card2 = compiled.querySelector('#loan-card-2');
      expect(card2).toBeTruthy();
      expect(card2?.textContent).toContain('LOAN1700000002');
      expect(card2?.textContent).toContain('PERSONAL');
      expect(card2?.textContent).toContain('200,000');
      expect(card2?.textContent).toContain('12%');
      expect(card2?.textContent).toContain('APPROVED');
    });

    it('should render loading state while retrieving loans', () => {
      const subject = new Subject<Loan[]>();
      loanServiceSpy.getMyLoans.mockReturnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      const loadingEl = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingEl).toBeTruthy();
      expect(loadingEl.textContent).toContain('Loading your loan applications...');

      subject.next(mockLoans);
      subject.complete();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeNull();
    });

    it('should render empty state when no loans exist', () => {
      loanServiceSpy.getMyLoans.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.loans.length).toBe(0);
      const emptyEl = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyEl).toBeTruthy();
      expect(emptyEl.textContent).toContain('No Loans Found');

      const applyBtn = emptyEl.querySelector('#btn-empty-apply-loan');
      expect(applyBtn).toBeTruthy();
      applyBtn.click();
      fixture.detectChanges();
      expect(component.showApplyForm).toBe(true);
    });

    it('should show user-friendly error message if loan retrieval fails', () => {
      loanServiceSpy.getMyLoans.mockReturnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Unable to load loan records. Please try again later.');
      const alertEl = fixture.nativeElement.querySelector('.alert-error');
      expect(alertEl).toBeTruthy();
      expect(alertEl.textContent).toContain('Unable to load loan records');
    });
  });

  describe('Loan Application Form & Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      if (!component.showApplyForm) {
        component.toggleApplyForm();
        fixture.detectChanges();
      }
    });

    it('should toggle apply form visibility', () => {
      component.toggleApplyForm();
      fixture.detectChanges();
      expect(component.showApplyForm).toBe(false);

      component.toggleApplyForm();
      fixture.detectChanges();
      expect(component.showApplyForm).toBe(true);
    });

    it('should update loanType when loan type card is clicked', () => {
      if (!component.showApplyForm) {
        component.toggleApplyForm();
        fixture.detectChanges();
      }
      const personalBtn = fixture.nativeElement.querySelector('#type-btn-PERSONAL') as HTMLButtonElement;
      expect(personalBtn).toBeTruthy();

      personalBtn.click();
      fixture.detectChanges();

      expect(component.loanType?.value).toBe('PERSONAL');
      expect(component.selectedLoanTypeDetails?.rate).toBe(12.0);
    });

    it('should validate required fields', () => {
      component.loanForm.reset();
      expect(component.loanForm.valid).toBe(false);

      component.loanForm.patchValue({
        loanType: 'HOME',
        amount: 500, // < 1000
        tenureMonths: 0 // < 1
      });
      expect(component.loanForm.valid).toBe(false);

      component.loanForm.patchValue({
        amount: 1000000,
        tenureMonths: 120
      });
      expect(component.loanForm.valid).toBe(true);
    });

    it('should mark fields touched and show error when submitting invalid form', () => {
      component.loanForm.reset();
      component.onSubmitApply();
      fixture.detectChanges();

      expect(loanServiceSpy.applyLoan).not.toHaveBeenCalled();
      expect(component.amount?.touched).toBe(true);
      expect(component.errorMessage).toContain('Please complete all required fields');
    });

    it('should prevent duplicate submissions while request is in flight', () => {
      component.loanForm.setValue({
        loanType: 'VEHICLE',
        amount: 800000,
        tenureMonths: 60
      });

      const subject = new Subject<Loan>();
      loanServiceSpy.applyLoan.mockReturnValue(subject.asObservable());

      component.onSubmitApply();
      expect(component.isSubmitting).toBe(true);
      expect(loanServiceSpy.applyLoan).toHaveBeenCalledTimes(1);

      // Attempt second submission
      component.onSubmitApply();
      expect(loanServiceSpy.applyLoan).toHaveBeenCalledTimes(1);

      const createdLoan: Loan = {
        id: 3,
        loanId: 'LOAN1700000003',
        loanType: 'VEHICLE',
        amount: 800000,
        interestRate: 10.0,
        tenureMonths: 60,
        status: 'PENDING'
      };
      subject.next(createdLoan);
      subject.complete();
      expect(component.isSubmitting).toBe(false);
    });

    it('should successfully apply for loan, prepend to list, reset form, and display success message', () => {
      component.loanForm.setValue({
        loanType: 'VEHICLE',
        amount: 800000,
        tenureMonths: 60
      });

      const newLoan: Loan = {
        id: 3,
        loanId: 'LOAN1700000003',
        loanType: 'VEHICLE',
        amount: 800000,
        interestRate: 10.0,
        tenureMonths: 60,
        status: 'PENDING',
        applicationDate: '2026-10-02T13:00:00'
      };
      loanServiceSpy.applyLoan.mockReturnValue(of(newLoan));

      component.onSubmitApply();
      fixture.detectChanges();

      const expectedRequest: ApplyLoanRequest = {
        loanType: 'VEHICLE',
        amount: 800000,
        tenureMonths: 60
      };
      expect(loanServiceSpy.applyLoan).toHaveBeenCalledWith(expectedRequest);
      expect(component.loans.length).toBe(3);
      expect(component.loans[0]).toEqual(newLoan);
      expect(component.successMessage).toContain('LOAN1700000003');
      expect(component.showApplyForm).toBe(false);
    });

    it('should handle backend error on loan application failure', () => {
      component.loanForm.setValue({
        loanType: 'PERSONAL',
        amount: 10000,
        tenureMonths: 12
      });

      loanServiceSpy.applyLoan.mockReturnValue(
        throwError(() => ({
          error: { error: 'Invalid loan type or limit exceeded' }
        }))
      );

      component.onSubmitApply();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Invalid loan type or limit exceeded');
      expect(component.isSubmitting).toBe(false);
      expect(component.showApplyForm).toBe(true);
    });
  });

  describe('Loan Details Modal', () => {
    it('should open and close loan details modal', () => {
      fixture.detectChanges();
      component.viewLoanDetails(mockLoans[0]);
      fixture.detectChanges();

      expect(component.selectedLoanDetails).toEqual(mockLoans[0]);
      const modal = fixture.nativeElement.querySelector('.modal-card');
      expect(modal).toBeTruthy();
      expect(modal.textContent).toContain('LOAN1700000001');

      component.closeDetailsModal();
      fixture.detectChanges();

      expect(component.selectedLoanDetails).toBeNull();
      expect(fixture.nativeElement.querySelector('.modal-card')).toBeNull();
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
