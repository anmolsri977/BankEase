import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BillPayment, BillPaymentRequest, BillPaymentService, BillType } from './bill-payment.service';
import { Account, AccountService } from '../accounts/account.service';

@Component({
  selector: 'app-bill-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './bill-payments.html',
  styleUrl: './bill-payments.css'
})
export class BillPayments implements OnInit {
  private readonly billPaymentService = inject(BillPaymentService);
  private readonly accountService = inject(AccountService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  billPayments: BillPayment[] = [];
  userAccounts: Account[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  lastPayment: BillPayment | null = null;

  readonly supportedBillTypes: { id: BillType; label: string; icon: string }[] = [
    { id: 'ELECTRICITY', label: 'Electricity', icon: 'zap' },
    { id: 'WATER', label: 'Water', icon: 'droplet' },
    { id: 'MOBILE', label: 'Mobile Recharge', icon: 'smartphone' },
    { id: 'INTERNET', label: 'Broadband / Internet', icon: 'wifi' }
  ];

  paymentForm: FormGroup = this.fb.group({
    accountNumber: ['', [Validators.required]],
    billType: ['ELECTRICITY', [Validators.required]],
    billerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    billNumber: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    amount: [null, [Validators.required, Validators.min(1)]],
    description: ['']
  });

  get accountNumber() {
    return this.paymentForm.get('accountNumber');
  }

  get billType() {
    return this.paymentForm.get('billType');
  }

  get billerName() {
    return this.paymentForm.get('billerName');
  }

  get billNumber() {
    return this.paymentForm.get('billNumber');
  }

  get amount() {
    return this.paymentForm.get('amount');
  }

  get description() {
    return this.paymentForm.get('description');
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadBillPayments();
  }

  loadAccounts(): void {
    this.accountService.getMyAccounts().subscribe({
      next: (accounts) => {
        this.userAccounts = accounts || [];
        if (this.userAccounts.length > 0 && !this.accountNumber?.value) {
          const activeAccount = this.userAccounts.find((a) => a.status === 'ACTIVE') || this.userAccounts[0];
          this.paymentForm.patchValue({ accountNumber: activeAccount.accountNumber });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        // Accounts loading is secondary; paymentForm still permits manual entry or reload
        this.cdr.markForCheck();
      }
    });
  }

  loadBillPayments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.billPaymentService
      .getMyBillPayments()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.billPayments = data || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load bill payment history. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  selectBillType(type: BillType): void {
    this.paymentForm.patchValue({ billType: type });
    this.cdr.markForCheck();
  }

  onSubmitPayment(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.errorMessage = 'Please complete all required fields correctly before submitting.';
      this.cdr.markForCheck();
      return;
    }

    const val = this.paymentForm.value;
    const request: BillPaymentRequest = {
      accountNumber: String(val.accountNumber || '').trim(),
      billType: String(val.billType || '').trim().toUpperCase(),
      billerName: String(val.billerName || '').trim(),
      billNumber: String(val.billNumber || '').trim(),
      amount: Number(val.amount),
      description: val.description ? String(val.description).trim() : undefined
    };

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.billPaymentService
      .payBill(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (payment) => {
          this.lastPayment = payment;
          this.billPayments = [payment, ...this.billPayments];
          this.successMessage = `Payment of ₹${payment.amount} to ${payment.billerName} (${payment.billType}) was successful! Ref: ${payment.paymentId}`;
          const currentAccount = this.accountNumber?.value;
          this.paymentForm.reset({
            accountNumber: currentAccount,
            billType: 'ELECTRICITY',
            billerName: '',
            billNumber: '',
            amount: null,
            description: ''
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (err?.error?.error) {
            this.errorMessage = err.error.error;
          } else {
            this.errorMessage = 'Failed to process bill payment. Please check your account balance and details and try again.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  dismissMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.lastPayment = null;
    this.cdr.markForCheck();
  }

  get totalPaidAmount(): number {
    return this.billPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }

  get successfulPaymentsCount(): number {
    return this.billPayments.filter((p) => p.status === 'SUCCESS').length;
  }
}
