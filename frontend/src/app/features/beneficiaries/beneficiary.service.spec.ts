import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  BeneficiaryService,
  Beneficiary,
  CreateBeneficiaryRequest,
  DeleteBeneficiaryResponse
} from './beneficiary.service';

describe('BeneficiaryService', () => {
  let service: BeneficiaryService;
  let httpTestingController: HttpTestingController;

  const mockBeneficiaries: Beneficiary[] = [
    {
      id: 1,
      name: 'Aarav Sharma',
      accountNumber: '987654321012',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234'
    },
    {
      id: 2,
      name: 'Priya Patel',
      accountNumber: '876543210987',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0005678'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BeneficiaryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(BeneficiaryService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch authenticated customer beneficiaries from GET /api/beneficiaries/my', () => {
    service.getMyBeneficiaries().subscribe((beneficiaries) => {
      expect(beneficiaries.length).toBe(2);
      expect(beneficiaries).toEqual(mockBeneficiaries);
    });

    const req = httpTestingController.expectOne('/api/beneficiaries/my');
    expect(req.request.method).toBe('GET');
    req.flush(mockBeneficiaries);
  });

  it('should fetch beneficiary by id from GET /api/beneficiaries/{id}', () => {
    const singleBeneficiary = mockBeneficiaries[0];

    service.getBeneficiaryById(1).subscribe((beneficiary) => {
      expect(beneficiary).toEqual(singleBeneficiary);
    });

    const req = httpTestingController.expectOne('/api/beneficiaries/1');
    expect(req.request.method).toBe('GET');
    req.flush(singleBeneficiary);
  });

  it('should create a new beneficiary via POST /api/beneficiaries', () => {
    const newRequest: CreateBeneficiaryRequest = {
      name: 'Rohan Verma',
      accountNumber: '112233445566',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0000456'
    };
    const createdBeneficiary: Beneficiary = {
      id: 3,
      ...newRequest
    };

    service.createBeneficiary(newRequest).subscribe((beneficiary) => {
      expect(beneficiary).toEqual(createdBeneficiary);
    });

    const req = httpTestingController.expectOne('/api/beneficiaries');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newRequest);
    req.flush(createdBeneficiary, { status: 201, statusText: 'Created' });
  });

  it('should update an existing beneficiary via PUT /api/beneficiaries/{id}', () => {
    const updateRequest: CreateBeneficiaryRequest = {
      name: 'Aarav S. Sharma',
      accountNumber: '987654321012',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234'
    };
    const updatedBeneficiary: Beneficiary = {
      id: 1,
      ...updateRequest
    };

    service.updateBeneficiary(1, updateRequest).subscribe((beneficiary) => {
      expect(beneficiary).toEqual(updatedBeneficiary);
    });

    const req = httpTestingController.expectOne('/api/beneficiaries/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(updatedBeneficiary);
  });

  it('should delete a beneficiary via DELETE /api/beneficiaries/{id}', () => {
    const expectedResponse: DeleteBeneficiaryResponse = {
      message: 'Beneficiary deleted successfully'
    };

    service.deleteBeneficiary(1).subscribe((response) => {
      expect(response).toEqual(expectedResponse);
    });

    const req = httpTestingController.expectOne('/api/beneficiaries/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(expectedResponse);
  });

  it('should propagate error when API call fails', () => {
    let errorResponse: any;

    service.getMyBeneficiaries().subscribe({
      next: () => {
        throw new Error('expected call to fail');
      },
      error: (err) => {
        errorResponse = err;
      }
    });

    const req = httpTestingController.expectOne('/api/beneficiaries/my');
    req.flush({ error: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(errorResponse.status).toBe(500);
  });
});
