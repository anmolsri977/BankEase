import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Investments } from './investments';
import { Investment, InvestmentService, CreateInvestmentRequest } from './investment.service';

describe('Investments Component', () => {
  let component: Investments;
  let fixture: ComponentFixture<Investments>;
  let investmentServiceSpy: {
    createInvestment: ReturnType<typeof vi.fn>;
    getMyInvestments: ReturnType<typeof vi.fn>;
    getInvestmentById: ReturnType<typeof vi.fn>;
  };

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

  beforeEach(async () => {
    investmentServiceSpy = {
      createInvestment: vi.fn(),
      getMyInvestments: vi.fn().mockReturnValue(of(mockInvestments)),
      getInvestmentById: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Investments],
      providers: [
        { provide: InvestmentService, useValue: investmentServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Investments);
    component = fixture.componentInstance;
  });

  it('should create the Investments component and load investments on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(investmentServiceSpy.getMyInvestments).toHaveBeenCalled();
    expect(component.investments.length).toBe(2);
    expect(component.totalPortfolioValue).toBe(150000.0);
    expect(component.totalExpectedReturns).toBe(19000.0);
    expect(component.activeInvestmentsCount).toBe(2);
  });

  describe('Component Rendering & Data Display', () => {
    it('should render investment cards with investment ID, type, amount, status, and returns', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const card1 = compiled.querySelector('#investment-card-1');
      expect(card1).toBeTruthy();
      expect(card1?.textContent).toContain('INV1700000001');
      expect(card1?.textContent).toContain('FD');
      expect(card1?.textContent).toContain('100,000');
      expect(card1?.textContent).toContain('ACTIVE');
      expect(card1?.textContent).toContain('7,000.00');

      const card2 = compiled.querySelector('#investment-card-2');
      expect(card2).toBeTruthy();
      expect(card2?.textContent).toContain('INV1700000002');
      expect(card2?.textContent).toContain('MUTUAL_FUND');
      expect(card2?.textContent).toContain('50,000');
      expect(card2?.textContent).toContain('12,000.00');
    });

    it('should render loading state while retrieving investments', () => {
      const subject = new Subject<Investment[]>();
      investmentServiceSpy.getMyInvestments.mockReturnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      const loadingEl = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingEl).toBeTruthy();
      expect(loadingEl.textContent).toContain('Loading your investment portfolio...');

      subject.next(mockInvestments);
      subject.complete();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeNull();
    });

    it('should render empty state when no investments exist', () => {
      investmentServiceSpy.getMyInvestments.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.investments.length).toBe(0);
      const emptyEl = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyEl).toBeTruthy();
      expect(emptyEl.textContent).toContain('No Investments Found');

      const createBtn = emptyEl.querySelector('#btn-empty-create-investment');
      expect(createBtn).toBeTruthy();
      createBtn.click();
      fixture.detectChanges();
      expect(component.showCreateForm).toBe(true);
    });

    it('should show user-friendly error message if investment retrieval fails', () => {
      investmentServiceSpy.getMyInvestments.mockReturnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Unable to load investment portfolio. Please try again later.');
      const alertEl = fixture.nativeElement.querySelector('.alert-error');
      expect(alertEl).toBeTruthy();
      expect(alertEl.textContent).toContain('Unable to load investment portfolio');
    });
  });

  describe('Investment Creation Form & Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      if (!component.showCreateForm) {
        component.toggleCreateForm();
        fixture.detectChanges();
      }
    });

    it('should toggle create form visibility', () => {
      component.toggleCreateForm();
      fixture.detectChanges();
      expect(component.showCreateForm).toBe(false);

      component.toggleCreateForm();
      fixture.detectChanges();
      expect(component.showCreateForm).toBe(true);
    });

    it('should update investmentType when product card is clicked', () => {
      if (!component.showCreateForm) {
        component.toggleCreateForm();
        fixture.detectChanges();
      }
      const mfBtn = fixture.nativeElement.querySelector('#prod-btn-MUTUAL_FUND') as HTMLButtonElement;
      expect(mfBtn).toBeTruthy();

      mfBtn.click();
      fixture.detectChanges();

      expect(component.investmentType?.value).toBe('MUTUAL_FUND');
      expect(component.selectedProductDetails?.annualRate).toBe(12.0);
    });

    it('should calculate estimated returns preview accurately', () => {
      component.investmentForm.patchValue({
        investmentType: 'FD',
        amount: 100000,
        tenureMonths: 12
      });
      // 100000 * 7.0 * 12 / 1200 = 7000
      expect(component.estimatedReturnsPreview).toBe(7000);
    });

    it('should validate required fields', () => {
      component.investmentForm.reset();
      expect(component.investmentForm.valid).toBe(false);

      component.investmentForm.patchValue({
        investmentType: 'FD',
        amount: 50, // < 100
        tenureMonths: 0 // < 1
      });
      expect(component.investmentForm.valid).toBe(false);

      component.investmentForm.patchValue({
        amount: 25000,
        tenureMonths: 24
      });
      expect(component.investmentForm.valid).toBe(true);
    });

    it('should mark fields as touched and display error on invalid submission', () => {
      component.investmentForm.reset();
      component.onSubmitCreate();
      fixture.detectChanges();

      expect(investmentServiceSpy.createInvestment).not.toHaveBeenCalled();
      expect(component.amount?.touched).toBe(true);
      expect(component.errorMessage).toContain('Please complete all required fields');
    });

    it('should prevent duplicate submissions while creation is in flight', () => {
      component.investmentForm.setValue({
        investmentType: 'RD',
        amount: 5000,
        tenureMonths: 12
      });

      const subject = new Subject<Investment>();
      investmentServiceSpy.createInvestment.mockReturnValue(subject.asObservable());

      component.onSubmitCreate();
      expect(component.isSubmitting).toBe(true);
      expect(investmentServiceSpy.createInvestment).toHaveBeenCalledTimes(1);

      // Attempt second submission
      component.onSubmitCreate();
      expect(investmentServiceSpy.createInvestment).toHaveBeenCalledTimes(1);

      const created: Investment = {
        id: 3,
        investmentId: 'INV1700000003',
        investmentType: 'RD',
        amount: 5000,
        status: 'ACTIVE',
        returns: 325
      };
      subject.next(created);
      subject.complete();
      expect(component.isSubmitting).toBe(false);
    });

    it('should successfully create an investment, prepend to list, reset form, and show success message', () => {
      component.investmentForm.setValue({
        investmentType: 'STOCK',
        amount: 10000,
        tenureMonths: 6
      });

      const newInv: Investment = {
        id: 3,
        investmentId: 'INV1700000003',
        investmentType: 'STOCK',
        amount: 10000,
        status: 'ACTIVE',
        returns: 750,
        investmentDate: '2026-10-02T13:00:00',
        maturityDate: '2027-04-02T13:00:00'
      };
      investmentServiceSpy.createInvestment.mockReturnValue(of(newInv));

      component.onSubmitCreate();
      fixture.detectChanges();

      const expectedRequest: CreateInvestmentRequest = {
        investmentType: 'STOCK',
        amount: 10000,
        tenureMonths: 6
      };
      expect(investmentServiceSpy.createInvestment).toHaveBeenCalledWith(expectedRequest);
      expect(component.investments.length).toBe(3);
      expect(component.investments[0]).toEqual(newInv);
      expect(component.successMessage).toContain('INV1700000003');
      expect(component.showCreateForm).toBe(false);
    });

    it('should handle backend error on investment creation failure', () => {
      component.investmentForm.setValue({
        investmentType: 'FD',
        amount: 5000,
        tenureMonths: 12
      });

      investmentServiceSpy.createInvestment.mockReturnValue(
        throwError(() => ({
          error: { error: 'Invalid investment parameters' }
        }))
      );

      component.onSubmitCreate();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Invalid investment parameters');
      expect(component.isSubmitting).toBe(false);
      expect(component.showCreateForm).toBe(true);
    });
  });

  describe('Investment Details Modal', () => {
    it('should open and close investment details modal', () => {
      fixture.detectChanges();
      component.viewInvestmentDetails(mockInvestments[0]);
      fixture.detectChanges();

      expect(component.selectedInvestmentDetails).toEqual(mockInvestments[0]);
      const modal = fixture.nativeElement.querySelector('.modal-card');
      expect(modal).toBeTruthy();
      expect(modal.textContent).toContain('INV1700000001');

      component.closeDetailsModal();
      fixture.detectChanges();

      expect(component.selectedInvestmentDetails).toBeNull();
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
