import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type BillType = 'ELECTRICITY' | 'WATER' | 'MOBILE' | 'INTERNET' | string;

export interface BillPaymentAccount {
  id?: number;
  accountNumber: string;
  accountType?: string;
  balance?: number;
  status?: string;
}

export interface BillPaymentUser {
  id?: number;
  name?: string;
  email?: string;
}

export interface BillPayment {
  id: number;
  paymentId: string;
  billType: BillType;
  billerName: string;
  billNumber: string;
  amount: number;
  status: string;
  description?: string;
  createdAt?: string;
  paymentDate?: string;
  account?: BillPaymentAccount;
  user?: BillPaymentUser;
}

export interface BillPaymentRequest {
  accountNumber: string;
  billType: string;
  billerName: string;
  billNumber: string;
  amount: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillPaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/bill-payments';

  payBill(request: BillPaymentRequest): Observable<BillPayment> {
    return this.http.post<BillPayment>(`${this.baseUrl}/pay`, request);
  }

  getMyBillPayments(): Observable<BillPayment[]> {
    return this.http.get<BillPayment[]>(`${this.baseUrl}/my`);
  }

  getBillPaymentById(id: number): Observable<BillPayment> {
    return this.http.get<BillPayment>(`${this.baseUrl}/${id}`);
  }
}
