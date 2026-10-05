import { Component, Input, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem {
  label: string;
  route: string;
  id: string;
  exact?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() pageTitle: string = 'Online Banking';
  @Input() currentUserName: string = '';

  isMobileMenuOpen: boolean = false;
  customerName: string = 'Customer';
  userRole: string = 'Customer';

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', id: 'nav-dashboard', exact: true },
    { label: 'Accounts', route: '/accounts', id: 'nav-accounts' },
    { label: 'Transfers', route: '/transactions', id: 'nav-transactions' },
    { label: 'Beneficiaries', route: '/beneficiaries', id: 'nav-beneficiaries' },
    { label: 'Bills', route: '/bill-payments', id: 'nav-bill-payments' },
    { label: 'Loans', route: '/loans', id: 'nav-loans' },
    { label: 'Investments', route: '/investments', id: 'nav-investments' },
    { label: 'Audit Logs', route: '/audit-logs', id: 'nav-audit-logs' },
    { label: 'Profile', route: '/profile', id: 'nav-profile' }
  ];

  ngOnInit(): void {
    this.resolveIdentity();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.cdr.markForCheck();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.cdr.markForCheck();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private resolveIdentity(): void {
    if (this.currentUserName) {
      this.customerName = this.currentUserName;
    }
    const token = this.authService.getToken();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role) {
            this.userRole = payload.role.replace('ROLE_', '');
          }
          if (!this.currentUserName) {
            if (payload.name) {
              this.customerName = payload.name;
            } else if (payload.sub) {
              const prefix = payload.sub.split('@')[0];
              this.customerName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            }
          }
        }
      } catch {
        // ignore malformed token in test environment
      }
    }
  }
}
