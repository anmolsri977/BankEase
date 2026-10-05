import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLogUser {
  id?: number;
  name?: string;
  email?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  user?: AuditLogUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/audit-logs';

  getMyAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.baseUrl}/my`);
  }

  getAllAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(this.baseUrl);
  }
}
