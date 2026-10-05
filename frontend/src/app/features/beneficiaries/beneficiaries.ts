import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Beneficiary, BeneficiaryService, CreateBeneficiaryRequest } from './beneficiary.service';

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './beneficiaries.html',
  styleUrl: './beneficiaries.css'
})
export class Beneficiaries implements OnInit {
  private readonly beneficiaryService = inject(BeneficiaryService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  beneficiaries: Beneficiary[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  deletingId: number | null = null;
  showAddForm: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  beneficiaryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    accountNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{6,20}$/)]],
    bankName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/)]]
  });

  ngOnInit(): void {
    this.loadBeneficiaries();
  }

  loadBeneficiaries(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.beneficiaryService
      .getMyBeneficiaries()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.beneficiaries = data || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load beneficiaries. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.showAddForm) {
      this.beneficiaryForm.reset();
    }
    this.cdr.markForCheck();
  }

  onSubmitAddBeneficiary(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.beneficiaryForm.invalid) {
      this.beneficiaryForm.markAllAsTouched();
      this.errorMessage = 'Please fix the errors in the form before submitting.';
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    const formVal = this.beneficiaryForm.value;
    const request: CreateBeneficiaryRequest = {
      name: (formVal.name || '').trim(),
      accountNumber: (formVal.accountNumber || '').trim(),
      bankName: (formVal.bankName || '').trim(),
      ifscCode: (formVal.ifscCode || '').trim().toUpperCase()
    };

    this.beneficiaryService
      .createBeneficiary(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (newBeneficiary) => {
          this.beneficiaries = [newBeneficiary, ...this.beneficiaries];
          this.successMessage = `Beneficiary "${newBeneficiary.name}" added successfully!`;
          this.beneficiaryForm.reset();
          this.showAddForm = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (err?.error?.error) {
            this.errorMessage = err.error.error;
          } else {
            this.errorMessage = 'Failed to add beneficiary. Please check the details and try again.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  onDeleteBeneficiary(id: number): void {
    if (this.deletingId !== null) {
      return;
    }

    this.deletingId = id;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.beneficiaryService
      .deleteBeneficiary(id)
      .pipe(
        finalize(() => {
          this.deletingId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          const removed = this.beneficiaries.find((b) => b.id === id);
          this.beneficiaries = this.beneficiaries.filter((b) => b.id !== id);
          this.successMessage = res?.message || (removed ? `Beneficiary "${removed.name}" deleted successfully.` : 'Beneficiary deleted successfully.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (err?.error?.error) {
            this.errorMessage = err.error.error;
          } else {
            this.errorMessage = 'Failed to delete beneficiary. Please try again.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  dismissMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  get totalBeneficiariesCount(): number {
    return this.beneficiaries.length;
  }
}
