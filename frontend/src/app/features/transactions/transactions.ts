import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Transaction, TransactionService, TransferRequest } from './transaction.service';
import { Account, AccountService } from '../accounts/account.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css'
})
export class Transactions implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly accountService = inject(AccountService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  transactions: Transaction[] = [];
  userAccounts: Account[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  selectedTransaction: Transaction | null = null;
  isLoadingDetails: boolean = false;
  detailsError: string = '';

  viewTransactionDetails(tx: Transaction): void {
    this.isLoadingDetails = true;
    this.detailsError = '';
    this.selectedTransaction = null;
    this.cdr.markForCheck();

    this.transactionService.getTransactionById(tx.id).subscribe({
      next: (fullTx) => {
        this.selectedTransaction = fullTx;
        this.isLoadingDetails = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoadingDetails = false;
        const msg = err?.error?.error;
        if (msg && typeof msg === 'string' && !msg.includes('Exception')) {
          this.detailsError = msg;
        } else {
          this.detailsError = 'Unable to load transaction details. Access denied or record not found.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  closeTransactionDetails(): void {
    this.selectedTransaction = null;
    this.detailsError = '';
    this.isLoadingDetails = false;
    this.cdr.markForCheck();
  }

  transferForm: FormGroup = this.fb.group({
    senderAccountNumber: ['', [Validators.required]],
    receiverAccountNumber: ['', [Validators.required, Validators.minLength(4)]],
    amount: [null, [Validators.required, Validators.min(1)]],
    description: ['']
  });

  get senderAccountNumber() {
    return this.transferForm.get('senderAccountNumber');
  }

  get receiverAccountNumber() {
    return this.transferForm.get('receiverAccountNumber');
  }

  get amount() {
    return this.transferForm.get('amount');
  }

  get description() {
    return this.transferForm.get('description');
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.transactionService
      .getMyTransactions()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.transactions = data || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load transaction history. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  loadAccounts(): void {
    this.accountService.getMyAccounts().subscribe({
      next: (accounts) => {
        this.userAccounts = accounts || [];
        if (this.userAccounts.length > 0 && !this.senderAccountNumber?.value) {
          const activeAccount = this.userAccounts.find((a) => a.status === 'ACTIVE') || this.userAccounts[0];
          this.transferForm.patchValue({ senderAccountNumber: activeAccount.accountNumber });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        // Non-blocking error for account dropdown
      }
    });
  }

  onSubmitTransfer(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    const formVal = this.transferForm.value;
    const sender = (formVal.senderAccountNumber || '').trim();
    const receiver = (formVal.receiverAccountNumber || '').trim();
    const amt = Number(formVal.amount);

    if (sender.toLowerCase() === receiver.toLowerCase()) {
      this.errorMessage = 'Sender and receiver account numbers cannot be the same.';
      this.cdr.markForCheck();
      return;
    }

    if (!amt || amt <= 0) {
      this.errorMessage = 'Transfer amount must be greater than zero.';
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    const payload: TransferRequest = {
      senderAccountNumber: sender,
      receiverAccountNumber: receiver,
      amount: amt,
      description: (formVal.description || '').trim() || undefined
    };

    this.transactionService
      .transferFunds(payload)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (newTxn) => {
          this.transactions = [newTxn, ...this.transactions];
          this.successMessage = `Fund transfer of ₹${amt.toLocaleString()} to account ${receiver} completed successfully!`;
          this.transferForm.patchValue({
            receiverAccountNumber: '',
            amount: null,
            description: ''
          });
          this.transferForm.markAsPristine();
          this.transferForm.markAsUntouched();
          this.loadAccounts(); // refresh balance
          this.cdr.markForCheck();
        },
        error: (err) => {
          // User-friendly message without raw exceptions
          const backendMsg = err?.error?.error;
          if (backendMsg && typeof backendMsg === 'string' && !backendMsg.includes('Exception') && !backendMsg.includes('java.')) {
            this.errorMessage = backendMsg;
          } else {
            this.errorMessage = 'Transfer failed. Please verify the account details and available balance.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  isDebit(txn: Transaction): boolean {
    const senderNum = txn.senderAccount?.accountNumber;
    if (!senderNum) return false;
    return this.userAccounts.some((acc) => acc.accountNumber === senderNum) || true;
  }

  dismissMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }
}
