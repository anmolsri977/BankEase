import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type LoanType = 'PERSONAL' | 'HOME' | 'EDUCATION' | 'VEHICLE' | string;
export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'CLOSED' | string;

export interface LoanUser {
  id?: number;
  name?: string;
  email?: string;
}

export interface Loan {
  id: number;
  loanId: string;
  loanType: LoanType;
  amount: number;
  interestRate: number;
  tenureMonths: number;
  status: LoanStatus;
  applicationDate?: string;
  remarks?: string;
  user?: LoanUser;
}

export interface ApplyLoanRequest {
  loanType: string;
  amount: number;
  tenureMonths: number;
}

export interface UpdateLoanStatusRequest {
  status: string;
  remarks?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/loans';

  applyLoan(request: ApplyLoanRequest): Observable<Loan> {
    return this.http.post<Loan>(`${this.baseUrl}/apply`, request);
  }

  getMyLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.baseUrl}/my`);
  }

  getLoanById(id: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.baseUrl}/${id}`);
  }

  getAllLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(this.baseUrl);
  }

  updateLoanStatus(id: number, request: UpdateLoanStatusRequest): Observable<Loan> {
    return this.http.put<Loan>(`${this.baseUrl}/${id}/status`, request);
  }
}
