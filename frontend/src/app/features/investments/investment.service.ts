import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type InvestmentType = 'FD' | 'RD' | 'MUTUAL_FUND' | 'STOCK' | string;
export type InvestmentStatus = 'ACTIVE' | 'MATURED' | 'CLOSED' | string;

export interface InvestmentUser {
  id?: number;
  name?: string;
  email?: string;
}

export interface Investment {
  id: number;
  investmentId: string;
  investmentType: InvestmentType;
  amount: number;
  status: InvestmentStatus;
  investmentDate?: string;
  maturityDate?: string;
  returns?: number;
  user?: InvestmentUser;
}

export interface CreateInvestmentRequest {
  investmentType: string;
  amount: number;
  tenureMonths: number;
}

export interface UpdateInvestmentStatusRequest {
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/investments';

  createInvestment(request: CreateInvestmentRequest): Observable<Investment> {
    return this.http.post<Investment>(this.baseUrl, request);
  }

  getMyInvestments(): Observable<Investment[]> {
    return this.http.get<Investment[]>(`${this.baseUrl}/my`);
  }

  getInvestmentById(id: number): Observable<Investment> {
    return this.http.get<Investment>(`${this.baseUrl}/${id}`);
  }

  getAllInvestments(): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.baseUrl);
  }

  updateInvestmentStatus(id: number, request: UpdateInvestmentStatusRequest): Observable<Investment> {
    return this.http.put<Investment>(`${this.baseUrl}/${id}/status`, request);
  }
}
