import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Dashboard } from './dashboard/dashboard';
import { Accounts } from './features/accounts/accounts';
import { Transactions } from './features/transactions/transactions';
import { Beneficiaries } from './features/beneficiaries/beneficiaries';
import { BillPayments } from './features/bill-payments/bill-payments';
import { Loans } from './features/loans/loans';
import { Investments } from './features/investments/investments';
import { AuditLogs } from './features/audit-logs/audit-logs';
import { Profile } from './features/profile/profile';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'accounts', component: Accounts, canActivate: [authGuard] },
  { path: 'transactions', component: Transactions, canActivate: [authGuard] },
  { path: 'beneficiaries', component: Beneficiaries, canActivate: [authGuard] },
  { path: 'bill-payments', component: BillPayments, canActivate: [authGuard] },
  { path: 'loans', component: Loans, canActivate: [authGuard] },
  { path: 'investments', component: Investments, canActivate: [authGuard] },
  { path: 'audit-logs', component: AuditLogs, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
