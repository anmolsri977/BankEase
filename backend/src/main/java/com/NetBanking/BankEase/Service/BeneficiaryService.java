package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Dto.CreateBeneficiaryRequest;
import com.NetBanking.BankEase.Entity.Beneficiary;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.BeneficiaryRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BeneficiaryService {

    @Autowired
    private BeneficiaryRepository repo;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    public Beneficiary createBeneficiary(CreateBeneficiaryRequest request, String userEmail) {
        validateRequest(request);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + userEmail));

        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setName(request.getName().trim());
        beneficiary.setAccountNumber(request.getAccountNumber().trim());
        beneficiary.setBankName(request.getBankName().trim());
        beneficiary.setIfscCode(request.getIfscCode().trim().toUpperCase());
        beneficiary.setUser(user);

        Beneficiary saved = repo.save(beneficiary);
        auditLogService.logAction(user, "BENEFICIARY_ADDED", "Beneficiary added: " + saved.getName() + " (" + saved.getAccountNumber() + ")");
        return saved;
    }

    public List<Beneficiary> getMyBeneficiaries(String userEmail) {
        return repo.findByUserEmail(userEmail);
    }

    public Beneficiary getBeneficiaryById(Long id, String userEmail, boolean isAdmin) {
        Beneficiary beneficiary = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Beneficiary not found with id: " + id));

        if (!isAdmin && (beneficiary.getUser() == null || !beneficiary.getUser().getEmail().equalsIgnoreCase(userEmail))) {
            throw new AccessDeniedException("Access denied: You do not have permission to access this beneficiary");
        }

        return beneficiary;
    }

    public Beneficiary updateBeneficiary(Long id, CreateBeneficiaryRequest request, String userEmail, boolean isAdmin) {
        validateRequest(request);

        Beneficiary beneficiary = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Beneficiary not found with id: " + id));

        if (!isAdmin && (beneficiary.getUser() == null || !beneficiary.getUser().getEmail().equalsIgnoreCase(userEmail))) {
            throw new AccessDeniedException("Access denied: You do not have permission to update this beneficiary");
        }

        beneficiary.setName(request.getName().trim());
        beneficiary.setAccountNumber(request.getAccountNumber().trim());
        beneficiary.setBankName(request.getBankName().trim());
        beneficiary.setIfscCode(request.getIfscCode().trim().toUpperCase());

        return repo.save(beneficiary);
    }

    public void deleteBeneficiary(Long id, String userEmail, boolean isAdmin) {
        Beneficiary beneficiary = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Beneficiary not found with id: " + id));

        if (!isAdmin && (beneficiary.getUser() == null || !beneficiary.getUser().getEmail().equalsIgnoreCase(userEmail))) {
            throw new AccessDeniedException("Access denied: You do not have permission to delete this beneficiary");
        }

        repo.delete(beneficiary);
    }

    public List<Beneficiary> getAllBeneficiaries() {
        return repo.findAll();
    }

    private void validateRequest(CreateBeneficiaryRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Beneficiary request cannot be empty");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Beneficiary name is required");
        }
        if (request.getAccountNumber() == null || request.getAccountNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Beneficiary account number is required");
        }
        if (request.getBankName() == null || request.getBankName().trim().isEmpty()) {
            throw new IllegalArgumentException("Bank name is required");
        }
        if (request.getIfscCode() == null || request.getIfscCode().trim().isEmpty()) {
            throw new IllegalArgumentException("IFSC code is required");
        }
    }
}
