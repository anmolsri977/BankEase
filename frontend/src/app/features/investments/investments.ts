import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Investment, InvestmentService, CreateInvestmentRequest, InvestmentType } from './investment.service';

export interface InvestmentProductOption {
  type: InvestmentType;
  title: string;
  annualRate: number;
  description: string;
  risk: 'Low' | 'Moderate' | 'High';
}

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './investments.html',
  styleUrl: './investments.css'
})
export class Investments implements OnInit {
  private readonly investmentService = inject(InvestmentService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  investments: Investment[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  showCreateForm: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  selectedInvestmentDetails: Investment | null = null;

  readonly products: InvestmentProductOption[] = [
    { type: 'FD', title: 'Fixed Deposit (FD)', annualRate: 7.0, description: 'Guaranteed returns of 7.0% p.a. with capital safety and flexible maturity tenures.', risk: 'Low' },
    { type: 'RD', title: 'Recurring Deposit (RD)', annualRate: 6.5, description: 'Disciplined monthly savings yielding 6.5% p.a. fixed interest rate compounded quarterly.', risk: 'Low' },
    { type: 'MUTUAL_FUND', title: 'Mutual Funds', annualRate: 12.0, description: 'Professionally managed equity & hybrid portfolios targeting 12.0% p.a. long-term wealth creation.', risk: 'Moderate' },
    { type: 'STOCK', title: 'Equity Stocks', annualRate: 15.0, description: 'Direct stock market growth opportunities with an estimated 15.0% p.a. return potential.', risk: 'High' }
  ];

  investmentForm: FormGroup = this.fb.group({
    investmentType: ['FD', [Validators.required]],
    amount: [null, [Validators.required, Validators.min(100)]],
    tenureMonths: [null, [Validators.required, Validators.min(1), Validators.max(360)]]
  });

  get investmentType() {
    return this.investmentForm.get('investmentType');
  }

  get amount() {
    return this.investmentForm.get('amount');
  }

  get tenureMonths() {
    return this.investmentForm.get('tenureMonths');
  }

  ngOnInit(): void {
    this.loadInvestments();
  }

  loadInvestments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.investmentService
      .getMyInvestments()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.investments = data || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load investment portfolio. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.showCreateForm) {
      this.investmentForm.reset({ investmentType: 'FD' });
    }
    this.cdr.markForCheck();
  }

  selectProductType(type: InvestmentType): void {
    this.investmentForm.patchValue({ investmentType: type });
    this.cdr.markForCheck();
  }

  get selectedProductDetails(): InvestmentProductOption | undefined {
    const cur = this.investmentType?.value;
    return this.products.find((p) => p.type === cur);
  }

  get estimatedReturnsPreview(): number {
    const amt = Number(this.amount?.value) || 0;
    const months = Number(this.tenureMonths?.value) || 0;
    const rate = this.selectedProductDetails?.annualRate || 7.0;
    if (amt > 0 && months > 0) {
      return Math.round((amt * rate * months) / 1200 * 100) / 100;
    }
    return 0;
  }

  onSubmitCreate(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.investmentForm.invalid) {
      this.investmentForm.markAllAsTouched();
      this.errorMessage = 'Please complete all required fields with valid amounts and tenures.';
      this.cdr.markForCheck();
      return;
    }

    const val = this.investmentForm.value;
    const request: CreateInvestmentRequest = {
      investmentType: String(val.investmentType || '').trim().toUpperCase(),
      amount: Number(val.amount),
      tenureMonths: Number(val.tenureMonths)
    };

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.investmentService
      .createInvestment(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (newInv) => {
          this.investments = [newInv, ...this.investments];
          this.successMessage = `Your ${newInv.investmentType} investment of ₹${newInv.amount} (${newInv.investmentId}) was successfully created!`;
          this.showCreateForm = false;
          this.investmentForm.reset({ investmentType: 'FD' });
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (err?.error?.error) {
            this.errorMessage = err.error.error;
          } else {
            this.errorMessage = 'Failed to create investment. Please verify the amount and try again.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  viewInvestmentDetails(inv: Investment): void {
    this.selectedInvestmentDetails = inv;
    this.cdr.markForCheck();
  }

  closeDetailsModal(): void {
    this.selectedInvestmentDetails = null;
    this.cdr.markForCheck();
  }

  dismissMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  get totalPortfolioValue(): number {
    return this.investments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  }

  get totalExpectedReturns(): number {
    return this.investments.reduce((sum, inv) => sum + (Number(inv.returns) || 0), 0);
  }

  get activeInvestmentsCount(): number {
    return this.investments.filter((inv) => inv.status === 'ACTIVE').length;
  }
}
