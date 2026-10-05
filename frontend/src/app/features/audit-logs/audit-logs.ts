import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuditLog, AuditLogService } from './audit-log.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css'
})
export class AuditLogs implements OnInit {
  private readonly auditLogService = inject(AuditLogService);
  private readonly cdr = inject(ChangeDetectorRef);

  auditLogs: AuditLog[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  filterQuery: string = '';
  selectedActionFilter: string = 'ALL';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.auditLogService
      .getMyAuditLogs()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.auditLogs = data || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load security audit logs. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  get filteredLogs(): AuditLog[] {
    const q = this.filterQuery.trim().toLowerCase();
    const actionFilter = this.selectedActionFilter;

    return this.auditLogs.filter((log) => {
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesQuery =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        (log.user?.email && log.user.email.toLowerCase().includes(q));

      return matchesAction && matchesQuery;
    });
  }

  get availableActions(): string[] {
    const set = new Set<string>();
    this.auditLogs.forEach((log) => {
      if (log.action) {
        set.add(log.action);
      }
    });
    return Array.from(set);
  }

  dismissMessages(): void {
    this.errorMessage = '';
    this.cdr.markForCheck();
  }
}
