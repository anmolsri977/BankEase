import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Beneficiaries } from './beneficiaries';
import { Beneficiary, BeneficiaryService, CreateBeneficiaryRequest } from './beneficiary.service';

describe('Beneficiaries Component', () => {
  let component: Beneficiaries;
  let fixture: ComponentFixture<Beneficiaries>;
  let beneficiaryServiceSpy: {
    getMyBeneficiaries: ReturnType<typeof vi.fn>;
    createBeneficiary: ReturnType<typeof vi.fn>;
    deleteBeneficiary: ReturnType<typeof vi.fn>;
  };

  const mockBeneficiaries: Beneficiary[] = [
    {
      id: 1,
      name: 'Aarav Sharma',
      accountNumber: '987654321012',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234'
    },
    {
      id: 2,
      name: 'Priya Patel',
      accountNumber: '876543210987',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0005678'
    }
  ];

  beforeEach(async () => {
    beneficiaryServiceSpy = {
      getMyBeneficiaries: vi.fn().mockReturnValue(of(mockBeneficiaries)),
      createBeneficiary: vi.fn(),
      deleteBeneficiary: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Beneficiaries],
      providers: [
        { provide: BeneficiaryService, useValue: beneficiaryServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Beneficiaries);
    component = fixture.componentInstance;
  });

  it('should create the Beneficiaries component and load beneficiaries on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(beneficiaryServiceSpy.getMyBeneficiaries).toHaveBeenCalled();
    expect(component.beneficiaries.length).toBe(2);
    expect(component.totalBeneficiariesCount).toBe(2);
  });

  describe('Component Rendering & Data Display', () => {
    it('should render beneficiary cards with name, bank name, account number, and IFSC', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const card1 = compiled.querySelector('#beneficiary-card-1');
      expect(card1).toBeTruthy();
      expect(card1?.textContent).toContain('Aarav Sharma');
      expect(card1?.textContent).toContain('HDFC Bank');
      expect(card1?.textContent).toContain('987654321012');
      expect(card1?.textContent).toContain('HDFC0001234');

      const card2 = compiled.querySelector('#beneficiary-card-2');
      expect(card2).toBeTruthy();
      expect(card2?.textContent).toContain('Priya Patel');
      expect(card2?.textContent).toContain('State Bank of India');
      expect(card2?.textContent).toContain('876543210987');
      expect(card2?.textContent).toContain('SBIN0005678');
    });

    it('should render loading state while retrieving beneficiaries', () => {
      const subject = new Subject<Beneficiary[]>();
      beneficiaryServiceSpy.getMyBeneficiaries.mockReturnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      const loadingEl = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingEl).toBeTruthy();
      expect(loadingEl.textContent).toContain('Loading beneficiaries...');

      subject.next(mockBeneficiaries);
      subject.complete();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeNull();
    });

    it('should render empty state when no beneficiaries exist', () => {
      beneficiaryServiceSpy.getMyBeneficiaries.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.beneficiaries.length).toBe(0);
      const emptyEl = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyEl).toBeTruthy();
      expect(emptyEl.textContent).toContain('No Beneficiaries Added Yet');

      const addBtn = emptyEl.querySelector('#btn-empty-add-beneficiary');
      expect(addBtn).toBeTruthy();
      addBtn.click();
      fixture.detectChanges();
      expect(component.showAddForm).toBe(true);
    });

    it('should show user-friendly error message if initial fetch fails', () => {
      beneficiaryServiceSpy.getMyBeneficiaries.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Unable to load beneficiaries. Please try again later.');
      const alertEl = fixture.nativeElement.querySelector('.alert-error');
      expect(alertEl).toBeTruthy();
      expect(alertEl.textContent).toContain('Unable to load beneficiaries');
    });
  });

  describe('Form Validation & Adding Beneficiary', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.showAddForm = true;
      fixture.detectChanges();
    });

    it('should toggle add beneficiary form open and closed', () => {
      component.toggleAddForm();
      fixture.detectChanges();
      expect(component.showAddForm).toBe(false);

      component.toggleAddForm();
      fixture.detectChanges();
      expect(component.showAddForm).toBe(true);
    });

    it('should validate required fields and formats', () => {
      expect(component.beneficiaryForm.valid).toBe(false);

      component.beneficiaryForm.controls['name'].setValue('A'); // Too short (< 2)
      component.beneficiaryForm.controls['accountNumber'].setValue('abc'); // Non-numeric
      component.beneficiaryForm.controls['bankName'].setValue(''); // Required
      component.beneficiaryForm.controls['ifscCode'].setValue('INVALID_IFSC'); // Invalid IFSC format
      expect(component.beneficiaryForm.valid).toBe(false);

      component.beneficiaryForm.controls['name'].setValue('Rohan Verma');
      component.beneficiaryForm.controls['accountNumber'].setValue('123456789012');
      component.beneficiaryForm.controls['bankName'].setValue('Axis Bank');
      component.beneficiaryForm.controls['ifscCode'].setValue('UTIB0000123');
      expect(component.beneficiaryForm.valid).toBe(true);
    });

    it('should mark fields as touched and show error when submitting invalid form', () => {
      component.onSubmitAddBeneficiary();
      fixture.detectChanges();

      expect(beneficiaryServiceSpy.createBeneficiary).not.toHaveBeenCalled();
      expect(component.beneficiaryForm.get('name')?.touched).toBe(true);
      expect(component.errorMessage).toContain('Please fix the errors');
    });

    it('should prevent duplicate submissions while request is in progress', () => {
      component.beneficiaryForm.setValue({
        name: 'Rohan Verma',
        accountNumber: '123456789012',
        bankName: 'Axis Bank',
        ifscCode: 'UTIB0000123'
      });

      const subject = new Subject<Beneficiary>();
      beneficiaryServiceSpy.createBeneficiary.mockReturnValue(subject.asObservable());

      component.onSubmitAddBeneficiary();
      expect(component.isSubmitting).toBe(true);
      expect(beneficiaryServiceSpy.createBeneficiary).toHaveBeenCalledTimes(1);

      // Attempt second submission while still in progress
      component.onSubmitAddBeneficiary();
      expect(beneficiaryServiceSpy.createBeneficiary).toHaveBeenCalledTimes(1);

      const created: Beneficiary = {
        id: 3,
        name: 'Rohan Verma',
        accountNumber: '123456789012',
        bankName: 'Axis Bank',
        ifscCode: 'UTIB0000123'
      };
      subject.next(created);
      subject.complete();
      expect(component.isSubmitting).toBe(false);
    });

    it('should successfully create a beneficiary, prepend to list, reset form, and display success message', () => {
      const formPayload = {
        name: 'Rohan Verma',
        accountNumber: '123456789012',
        bankName: 'Axis Bank',
        ifscCode: 'utib0000123'
      };
      component.beneficiaryForm.setValue(formPayload);

      const newBeneficiary: Beneficiary = {
        id: 3,
        name: 'Rohan Verma',
        accountNumber: '123456789012',
        bankName: 'Axis Bank',
        ifscCode: 'UTIB0000123'
      };
      beneficiaryServiceSpy.createBeneficiary.mockReturnValue(of(newBeneficiary));

      component.onSubmitAddBeneficiary();
      fixture.detectChanges();

      const expectedRequest: CreateBeneficiaryRequest = {
        name: 'Rohan Verma',
        accountNumber: '123456789012',
        bankName: 'Axis Bank',
        ifscCode: 'UTIB0000123'
      };
      expect(beneficiaryServiceSpy.createBeneficiary).toHaveBeenCalledWith(expectedRequest);
      expect(component.beneficiaries.length).toBe(3);
      expect(component.beneficiaries[0]).toEqual(newBeneficiary);
      expect(component.successMessage).toContain('Beneficiary "Rohan Verma" added successfully!');
      expect(component.showAddForm).toBe(false);
    });

    it('should handle creation error and show friendly error message', () => {
      component.beneficiaryForm.setValue({
        name: 'Rohan Verma',
        accountNumber: '123456789012',
        bankName: 'Axis Bank',
        ifscCode: 'UTIB0000123'
      });

      beneficiaryServiceSpy.createBeneficiary.mockReturnValue(
        throwError(() => ({
          error: { error: 'Beneficiary with this account number already exists' }
        }))
      );

      component.onSubmitAddBeneficiary();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Beneficiary with this account number already exists');
      expect(component.isSubmitting).toBe(false);
      expect(component.showAddForm).toBe(true);
    });
  });

  describe('Deleting Beneficiary', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should successfully delete a beneficiary and remove from list', () => {
      beneficiaryServiceSpy.deleteBeneficiary.mockReturnValue(
        of({ message: 'Beneficiary deleted successfully' })
      );

      component.onDeleteBeneficiary(1);
      fixture.detectChanges();

      expect(beneficiaryServiceSpy.deleteBeneficiary).toHaveBeenCalledWith(1);
      expect(component.beneficiaries.length).toBe(1);
      expect(component.beneficiaries.find((b) => b.id === 1)).toBeUndefined();
      expect(component.successMessage).toBe('Beneficiary deleted successfully');
    });

    it('should prevent concurrent deletions while one is in progress', () => {
      const subject = new Subject<{ message: string }>();
      beneficiaryServiceSpy.deleteBeneficiary.mockReturnValue(subject.asObservable());

      component.onDeleteBeneficiary(1);
      expect(component.deletingId).toBe(1);

      // Attempt second deletion call
      component.onDeleteBeneficiary(2);
      expect(beneficiaryServiceSpy.deleteBeneficiary).toHaveBeenCalledTimes(1);

      subject.next({ message: 'Beneficiary deleted successfully' });
      subject.complete();
      expect(component.deletingId).toBeNull();
    });

    it('should handle deletion error and display error message', () => {
      beneficiaryServiceSpy.deleteBeneficiary.mockReturnValue(
        throwError(() => ({
          error: { error: 'Beneficiary not found or unauthorized' }
        }))
      );

      component.onDeleteBeneficiary(1);
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Beneficiary not found or unauthorized');
      expect(component.beneficiaries.length).toBe(2);
      expect(component.deletingId).toBeNull();
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
