import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Transactions } from './transactions';
import { Transaction, TransactionService } from './transaction.service';
import { Account, AccountService } from '../accounts/account.service';

describe('Transactions Component', () => {
  let component: Transactions;
  let fixture: ComponentFixture<Transactions>;
  let transactionServiceSpy: {
    getMyTransactions: ReturnType<typeof vi.fn>;
    transferFunds: ReturnType<typeof vi.fn>;
    getTransactionById: ReturnType<typeof vi.fn>;
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
    }
  ];

  const mockTransaction: Transaction = {
    id: 1,
    transactionId: 'TXN1001',
    transactionType: 'TRANSFER',
    amount: 1500.0,
    description: 'Grocery payment',
    status: 'SUCCESS',
    transactionDate: '2026-03-31T10:00:00',
    createdAt: '2026-03-31T10:00:00',
    senderAccount: {
      accountNumber: '100234891234',
      user: { email: 'customer@bankease.com' }
    },
    receiverAccount: {
      accountNumber: '200987654321',
      user: { email: 'merchant@bankease.com' }
    }
  };

  beforeEach(async () => {
    transactionServiceSpy = {
      getMyTransactions: vi.fn().mockReturnValue(of([mockTransaction])),
      transferFunds: vi.fn(),
      getTransactionById: vi.fn().mockReturnValue(of(mockTransaction))
    };

    accountServiceSpy = {
      getMyAccounts: vi.fn().mockReturnValue(of(mockAccounts))
    };

    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Transactions);
    component = fixture.componentInstance;
  });

  it('should create the component and load accounts and transactions on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(transactionServiceSpy.getMyTransactions).toHaveBeenCalled();
    expect(accountServiceSpy.getMyAccounts).toHaveBeenCalled();
    expect(component.transactions.length).toBe(1);
    expect(component.senderAccountNumber?.value).toBe('100234891234');
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      fixture.detectChanges();
      component.transferForm.reset();

      expect(component.transferForm.valid).toBe(false);
      expect(component.senderAccountNumber?.errors?.['required']).toBeTruthy();
      expect(component.receiverAccountNumber?.errors?.['required']).toBeTruthy();
      expect(component.amount?.errors?.['required']).toBeTruthy();
    });

    it('should validate minimum amount of 1', () => {
      fixture.detectChanges();
      component.transferForm.patchValue({
        senderAccountNumber: '100234891234',
        receiverAccountNumber: '200987654321',
        amount: 0
      });

      expect(component.amount?.errors?.['min']).toBeTruthy();
      expect(component.transferForm.valid).toBe(false);

      component.transferForm.patchValue({ amount: 100 });
      expect(component.amount?.errors).toBeNull();
      expect(component.transferForm.valid).toBe(true);
    });

    it('should prevent submission when sender and receiver are the same', () => {
      fixture.detectChanges();
      component.transferForm.patchValue({
        senderAccountNumber: '100234891234',
        receiverAccountNumber: '100234891234',
        amount: 500
      });

      component.onSubmitTransfer();
      fixture.detectChanges();

      expect(transactionServiceSpy.transferFunds).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Sender and receiver account numbers cannot be the same.');
    });
  });

  describe('Fund Transfer Submission', () => {
    it('should call TransactionService.transferFunds on valid submission and prepend transaction', () => {
      const newTxn: Transaction = {
        id: 2,
        transactionId: 'TXN1002',
        transactionType: 'TRANSFER',
        amount: 2500.0,
        description: 'Rent',
        status: 'SUCCESS',
        createdAt: '2026-10-02T12:00:00',
        senderAccount: { accountNumber: '100234891234' },
        receiverAccount: { accountNumber: '300112233445' }
      };

      transactionServiceSpy.transferFunds.mockReturnValue(of(newTxn));
      fixture.detectChanges();

      component.transferForm.patchValue({
        senderAccountNumber: '100234891234',
        receiverAccountNumber: '300112233445',
        amount: 2500,
        description: 'Rent'
      });

      component.onSubmitTransfer();
      fixture.detectChanges();

      expect(transactionServiceSpy.transferFunds).toHaveBeenCalledWith({
        senderAccountNumber: '100234891234',
        receiverAccountNumber: '300112233445',
        amount: 2500,
        description: 'Rent'
      });
      expect(component.transactions[0].transactionId).toBe('TXN1002');
      expect(component.successMessage).toContain('Fund transfer of ₹2,500 to account 300112233445 completed successfully!');
      expect(component.receiverAccountNumber?.value).toBe('');
    });

    it('should prevent duplicate submissions while transfer is in flight', () => {
      const subject = new Subject<Transaction>();
      transactionServiceSpy.transferFunds.mockReturnValue(subject.asObservable());
      fixture.detectChanges();

      component.transferForm.patchValue({
        senderAccountNumber: '100234891234',
        receiverAccountNumber: '200987654321',
        amount: 1000
      });

      component.onSubmitTransfer();
      fixture.detectChanges();

      expect(component.isSubmitting).toBe(true);
      expect(transactionServiceSpy.transferFunds).toHaveBeenCalledTimes(1);

      // Duplicate attempt
      component.onSubmitTransfer();
      expect(transactionServiceSpy.transferFunds).toHaveBeenCalledTimes(1);

      subject.next(mockTransaction);
      subject.complete();
      fixture.detectChanges();

      expect(component.isSubmitting).toBe(false);
    });

    it('should display friendly error message when transfer fails', () => {
      transactionServiceSpy.transferFunds.mockReturnValue(
        throwError(() => ({
          error: { error: 'Insufficient balance in sender account' }
        }))
      );
      fixture.detectChanges();

      component.transferForm.patchValue({
        senderAccountNumber: '100234891234',
        receiverAccountNumber: '200987654321',
        amount: 1000000
      });

      component.onSubmitTransfer();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Insufficient balance in sender account');
      expect(component.isSubmitting).toBe(false);
      const alert = fixture.nativeElement.querySelector('.alert-error');
      expect(alert?.textContent).toContain('Insufficient balance in sender account');
    });
  });

  describe('History Rendering & States', () => {
    it('should render transaction cards with transaction details', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const card = compiled.querySelector('#txn-item-1');
      expect(card).toBeTruthy();
      expect(card?.textContent).toContain('TXN1001');
      expect(card?.textContent).toContain('100234891234');
      expect(card?.textContent).toContain('200987654321');
      expect(card?.textContent).toContain('Grocery payment');
      expect(card?.textContent).toContain('SUCCESS');
    });

    it('should render loading state when fetching transactions', () => {
      const subject = new Subject<Transaction[]>();
      transactionServiceSpy.getMyTransactions.mockReturnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.isLoading).toBe(true);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeTruthy();

      subject.next([mockTransaction]);
      subject.complete();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(fixture.nativeElement.querySelector('.loading-state')).toBeNull();
    });

    it('should render empty state when no transactions exist', () => {
      transactionServiceSpy.getMyTransactions.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.transactions.length).toBe(0);
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No Transactions Yet');
    });

    it('should dismiss error message when close button is clicked', () => {
      transactionServiceSpy.getMyTransactions.mockReturnValue(throwError(() => new Error('Error')));
      component.loadTransactions();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.alert-error')).toBeTruthy();
      const closeBtn = fixture.nativeElement.querySelector('.btn-alert-close') as HTMLButtonElement;
      closeBtn.click();
      fixture.detectChanges();

      expect(component.errorMessage).toBe('');
      expect(fixture.nativeElement.querySelector('.alert-error')).toBeNull();
    });
  });

  describe('Transaction Details View & Modal', () => {
    it('should fetch and display full transaction details in modal when view button is clicked', () => {
      fixture.detectChanges();

      const viewBtn = fixture.nativeElement.querySelector('#btn-view-txn-1') as HTMLButtonElement;
      expect(viewBtn).toBeTruthy();
      viewBtn.click();
      fixture.detectChanges();

      expect(transactionServiceSpy.getTransactionById).toHaveBeenCalledWith(1);
      expect(component.selectedTransaction).toEqual(mockTransaction);

      const modal = fixture.nativeElement.querySelector('#transaction-details-modal');
      expect(modal).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#modal-txn-id')?.textContent).toContain('TXN1001');
      expect(fixture.nativeElement.querySelector('#modal-txn-type')?.textContent).toContain('TRANSFER');
      expect(fixture.nativeElement.querySelector('#modal-txn-amount')?.textContent).toContain('1,500.00');
      expect(fixture.nativeElement.querySelector('#modal-txn-sender')?.textContent).toContain('100234891234');
      expect(fixture.nativeElement.querySelector('#modal-txn-receiver')?.textContent).toContain('200987654321');
      expect(fixture.nativeElement.querySelector('#modal-txn-desc')?.textContent).toContain('Grocery payment');
    });

    it('should close transaction details modal when back button is clicked', () => {
      fixture.detectChanges();
      component.viewTransactionDetails(mockTransaction);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('#transaction-details-modal')).toBeTruthy();

      const backBtn = fixture.nativeElement.querySelector('#btn-back-txn-details') as HTMLButtonElement;
      expect(backBtn).toBeTruthy();
      backBtn.click();
      fixture.detectChanges();

      expect(component.selectedTransaction).toBeNull();
      expect(fixture.nativeElement.querySelector('#transaction-details-modal')).toBeNull();
    });

    it('should handle error when fetching transaction details fails', () => {
      transactionServiceSpy.getTransactionById.mockReturnValue(
        throwError(() => ({ error: { error: 'Transaction not found or access denied' } }))
      );

      fixture.detectChanges();
      component.viewTransactionDetails(mockTransaction);
      fixture.detectChanges();

      expect(component.detailsError).toBe('Transaction not found or access denied');
      const errBox = fixture.nativeElement.querySelector('#modal-txn-error');
      expect(errBox).toBeTruthy();
      expect(errBox.textContent).toContain('Transaction not found');
    });
  });
});
