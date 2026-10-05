import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserSummary {
  id?: number;
  name?: string;
  email?: string;
}

export interface AccountSummary {
  id?: number;
  accountNumber: string;
  accountType?: string;
  balance?: number;
  status?: string;
  user?: UserSummary;
}

export interface Transaction {
  id: number;
  transactionId: string;
  transactionType: string;
  amount: number;
  description?: string;
  status: string;
  transactionDate?: string;
  createdAt?: string;
  account?: AccountSummary;
  senderAccount?: AccountSummary;
  receiverAccount?: AccountSummary;
}

export interface TransferRequest {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/transactions';

  transferFunds(request: TransferRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/transfer`, request);
  }

  getMyTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/my`);
  }

  getTransactionById(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/${id}`);
  }
}
