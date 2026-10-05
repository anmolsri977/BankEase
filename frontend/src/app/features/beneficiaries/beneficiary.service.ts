import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Beneficiary {
  id: number;
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
}

export interface CreateBeneficiaryRequest {
  name: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
}

export interface DeleteBeneficiaryResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BeneficiaryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/beneficiaries';

  getMyBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.baseUrl}/my`);
  }

  getBeneficiaryById(id: number): Observable<Beneficiary> {
    return this.http.get<Beneficiary>(`${this.baseUrl}/${id}`);
  }

  createBeneficiary(request: CreateBeneficiaryRequest): Observable<Beneficiary> {
    return this.http.post<Beneficiary>(this.baseUrl, request);
  }

  updateBeneficiary(id: number, request: CreateBeneficiaryRequest): Observable<Beneficiary> {
    return this.http.put<Beneficiary>(`${this.baseUrl}/${id}`, request);
  }

  deleteBeneficiary(id: number): Observable<DeleteBeneficiaryResponse> {
    return this.http.delete<DeleteBeneficiaryResponse>(`${this.baseUrl}/${id}`);
  }
}
