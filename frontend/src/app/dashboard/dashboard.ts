import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { Account, AccountService } from '../features/accounts/account.service';
import { Transaction, TransactionService } from '../features/transactions/transaction.service';

export type BankAccount = Account;
export type { Transaction } from '../features/transactions/transaction.service';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  customerName: string = 'Customer';
  accounts: Account[] = [];
  recentTransactions: Transaction[] = [];

  isLoadingAccounts: boolean = false;
  isLoadingTransactions: boolean = false;
  accountsError: string | null = null;
  transactionsError: string | null = null;
  actionNotification: string = '';

  currentDate: Date = new Date();

  quickActions: QuickAction[] = [
    {
      id: 'transfer',
      title: 'Transfer Money',
      description: 'Instant transfer to any bank account',
      route: '/transactions'
    },
    {
      id: 'bills',
      title: 'Pay Bills',
      description: 'Electricity, water, mobile & DTH',
      route: '/bill-payments'
    },
    {
      id: 'beneficiary',
      title: 'Add Beneficiary',
      description: 'Manage trusted payees',
      route: '/beneficiaries'
    },
    {
      id: 'loan',
      title: 'Apply for Loan',
      description: 'Personal, home & education loans',
      route: '/loans'
    },
    {
      id: 'investments',
      title: 'Investments',
      description: 'Mutual funds, FDs & stocks',
      route: '/investments'
    }
  ];

  ngOnInit(): void {
    this.resolveCustomerIdentity();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loadAccounts();
    this.loadTransactions();
  }

  loadAccounts(): void {
    this.isLoadingAccounts = true;
    this.accountsError = null;
    this.cdr.markForCheck();

    this.accountService.getMyAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts || [];
        if (this.accounts.length > 0 && this.accounts[0].user?.name) {
          this.customerName = this.accounts[0].user.name;
        }
        this.isLoadingAccounts = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.accountsError = 'Unable to load your account information. Please try again.';
        this.isLoadingAccounts = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadTransactions(): void {
    this.isLoadingTransactions = true;
    this.transactionsError = null;
    this.cdr.markForCheck();

    this.transactionService.getMyTransactions().subscribe({
      next: (transactions) => {
        const txList = transactions || [];
        this.recentTransactions = txList.slice(0, 5);
        this.isLoadingTransactions = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.transactionsError = 'Unable to load recent transactions. Please try again.';
        this.isLoadingTransactions = false;
        this.cdr.markForCheck();
      }
    });
  }

  get totalBalance(): number {
    return this.accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
  }

  get totalAccounts(): number {
    return this.accounts.length;
  }

  get activeAccounts(): number {
    return this.accounts.filter((a) => (a.status || '').toUpperCase() === 'ACTIVE').length;
  }

  get primaryAccountNumber(): string {
    if (this.accounts.length === 0) return 'N/A';
    const active = this.accounts.find((a) => (a.status || '').toUpperCase() === 'ACTIVE');
    return active ? active.accountNumber : this.accounts[0].accountNumber;
  }

  get primaryAccountType(): string {
    if (this.accounts.length === 0) return 'N/A';
    const active = this.accounts.find((a) => (a.status || '').toUpperCase() === 'ACTIVE');
    return active ? active.accountType : this.accounts[0].accountType;
  }

  isDebit(tx: Transaction): boolean {
    if (!tx) return false;
    const userAccountNumbers = new Set(this.accounts.map((a) => a.accountNumber));
    const senderNum = tx.senderAccount?.accountNumber;
    const receiverNum = tx.receiverAccount?.accountNumber;

    if (senderNum && userAccountNumbers.has(senderNum)) {
      return true;
    }
    if (receiverNum && userAccountNumbers.has(receiverNum)) {
      return false;
    }
    return tx.transactionType === 'DEBIT' || tx.transactionType === 'WITHDRAWAL';
  }

  isCredit(tx: Transaction): boolean {
    return !this.isDebit(tx);
  }

  onQuickAction(action: QuickAction): void {
    if (action.route) {
      this.router.navigate([action.route]);
    }
  }

  showNotification(message: string): void {
    this.actionNotification = message;
    this.cdr.markForCheck();
  }

  clearNotification(): void {
    this.actionNotification = '';
    this.cdr.markForCheck();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private resolveCustomerIdentity(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.name) {
            this.customerName = payload.name;
          } else if (payload.sub && this.customerName === 'Customer') {
            const emailPrefix = payload.sub.split('@')[0];
            if (emailPrefix) {
              this.customerName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            }
          }
        }
      } catch {
        // ignore malformed token in test environment
      }
    }
  }
}
