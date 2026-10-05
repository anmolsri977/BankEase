import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Loan, LoanService, ApplyLoanRequest, LoanType } from './loan.service';

export interface LoanTypeOption {
  type: LoanType;
  title: string;
  rate: number;
  description: string;
}

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './loans.html',
  styleUrl: './loans.css'
})
export class Loans implements OnInit {
  private readonly loanService = inject(LoanService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  loans: Loan[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  showApplyForm: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedLoanDetails: Loan | null = null;

  readonly loanTypes: LoanTypeOption[] = [
    { type: 'HOME', title: 'Home Loan', rate: 8.5, description: 'Competitive rates from 8.5% p.a. for purchasing or renovating your dream home.' },
    { type: 'EDUCATION', title: 'Education Loan', rate: 9.0, description: 'Flexible student loans from 9.0% p.a. covering domestic and international universities.' },
    { type: 'VEHICLE', title: 'Vehicle Loan', rate: 10.0, description: 'Affordable auto financing from 10.0% p.a. for new and certified pre-owned cars.' },
    { type: 'PERSONAL', title: 'Personal Loan', rate: 12.0, description: 'Instant multi-purpose personal loans at 12.0% p.a. with minimal documentation.' }
  ];

  loanForm: FormGroup = this.fb.group({
    loanType: ['HOME', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(1000)]],
    tenureMonths: [null, [Validators.required, Validators.min(1), Validators.max(360)]]
  });

  get loanType() {
    return this.loanForm.get('loanType');
  }

  get amount() {
    return this.loanForm.get('amount');
  }

  get tenureMonths() {
    return this.loanForm.get('tenureMonths');
  }

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.loanService
      .getMyLoans()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.loans = data || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load loan records. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  toggleApplyForm(): void {
    this.showApplyForm = !this.showApplyForm;
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.showApplyForm) {
      this.loanForm.reset({ loanType: 'HOME' });
    }
    this.cdr.markForCheck();
  }

  selectLoanType(type: LoanType): void {
    this.loanForm.patchValue({ loanType: type });
    this.cdr.markForCheck();
  }

  get selectedLoanTypeDetails(): LoanTypeOption | undefined {
    const currentType = this.loanType?.value;
    return this.loanTypes.find((opt) => opt.type === currentType);
  }

  onSubmitApply(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      this.errorMessage = 'Please complete all required fields with valid values.';
      this.cdr.markForCheck();
      return;
    }

    const val = this.loanForm.value;
    const request: ApplyLoanRequest = {
      loanType: String(val.loanType || '').trim().toUpperCase(),
      amount: Number(val.amount),
      tenureMonths: Number(val.tenureMonths)
    };

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.loanService
      .applyLoan(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (newLoan) => {
          this.loans = [newLoan, ...this.loans];
          this.successMessage = `Your ${newLoan.loanType} loan application (${newLoan.loanId}) was submitted successfully with status PENDING!`;
          this.showApplyForm = false;
          this.loanForm.reset({ loanType: 'HOME' });
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (err?.error?.error) {
            this.errorMessage = err.error.error;
          } else {
            this.errorMessage = 'Failed to submit loan application. Please check the values and try again.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  viewLoanDetails(loan: Loan): void {
    this.selectedLoanDetails = loan;
    this.cdr.markForCheck();
  }

  closeDetailsModal(): void {
    this.selectedLoanDetails = null;
    this.cdr.markForCheck();
  }

  dismissMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  get totalLoanAmount(): number {
    return this.loans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }

  get activeLoansCount(): number {
    return this.loans.filter((l) => l.status === 'ACTIVE' || l.status === 'APPROVED').length;
  }
}
