import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Account, AccountService } from './account.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './accounts.html',
  styleUrl: './accounts.css'
})
export class Accounts implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly cdr = inject(ChangeDetectorRef);

  accounts: Account[] = [];
  isLoading: boolean = false;
  isCreating: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showCreateForm: boolean = false;
  selectedAccountType: 'SAVINGS' | 'CURRENT' = 'SAVINGS';

  selectedAccount: Account | null = null;
  isLoadingDetails: boolean = false;
  detailsError: string = '';

  ngOnInit(): void {
    this.loadAccounts();
  }

  viewAccountDetails(account: Account): void {
    this.isLoadingDetails = true;
    this.detailsError = '';
    this.selectedAccount = null;
    this.cdr.markForCheck();

    this.accountService.getAccountById(account.id).subscribe({
      next: (fullAccount) => {
        this.selectedAccount = fullAccount;
        this.isLoadingDetails = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoadingDetails = false;
        const msg = err?.error?.error;
        if (msg && typeof msg === 'string' && !msg.includes('Exception')) {
          this.detailsError = msg;
        } else {
          this.detailsError = 'Unable to load account details. Access denied or account not found.';
        }
        this.cdr.markForCheck();
      }
    });
  }

  closeAccountDetails(): void {
    this.selectedAccount = null;
    this.detailsError = '';
    this.isLoadingDetails = false;
    this.cdr.markForCheck();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.accountService
      .getMyAccounts()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.accounts = data || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load accounts. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  onCreateAccount(): void {
    if (this.isCreating) {
      return;
    }

    if (!this.selectedAccountType || (this.selectedAccountType !== 'SAVINGS' && this.selectedAccountType !== 'CURRENT')) {
      this.errorMessage = 'Please select a valid account type (Savings or Current).';
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.accountService
      .createAccount({ accountType: this.selectedAccountType })
      .pipe(
        finalize(() => {
          this.isCreating = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (newAccount) => {
          this.accounts = [newAccount, ...this.accounts];
          this.successMessage = `Account ${newAccount.accountNumber} created successfully!`;
          this.showCreateForm = false;
          this.selectedAccountType = 'SAVINGS';
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Failed to create account. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  dismissMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  get totalBalance(): number {
    return this.accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  }

  get activeAccountsCount(): number {
    return this.accounts.filter((acc) => acc.status === 'ACTIVE').length;
  }
}
