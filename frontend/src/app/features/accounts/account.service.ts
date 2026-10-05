import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
  id: number;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CURRENT' | string;
  balance: number;
  status: 'ACTIVE' | 'BLOCKED' | 'CLOSED' | string;
  createdAt?: string;
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
}

export interface CreateAccountRequest {
  accountType: 'SAVINGS' | 'CURRENT' | string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/accounts';

  getMyAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.baseUrl}/my`);
  }

  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  createAccount(request: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(this.baseUrl, request);
  }
}
