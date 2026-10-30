package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.CreateBeneficiaryRequest;
import com.NetBanking.BankEase.Entity.Beneficiary;
import com.NetBanking.BankEase.Service.BeneficiaryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {

    @Autowired
    private BeneficiaryService service;

    @PostMapping
    public ResponseEntity<Beneficiary> createBeneficiary(@Valid @RequestBody CreateBeneficiaryRequest request, Authentication authentication) {
        Beneficiary beneficiary = service.createBeneficiary(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(beneficiary);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Beneficiary>> getMyBeneficiaries(Authentication authentication) {
        List<Beneficiary> beneficiaries = service.getMyBeneficiaries(authentication.getName());
        return ResponseEntity.ok(beneficiaries);
    }

    @GetMapping
    public ResponseEntity<List<Beneficiary>> getAllBeneficiaries() {
        return ResponseEntity.ok(service.getAllBeneficiaries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Beneficiary> getBeneficiaryById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Beneficiary beneficiary = service.getBeneficiaryById(id, authentication.getName(), isAdmin);
        return ResponseEntity.ok(beneficiary);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Beneficiary> updateBeneficiary(@PathVariable Long id, @Valid @RequestBody CreateBeneficiaryRequest request, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Beneficiary updated = service.updateBeneficiary(id, request, authentication.getName(), isAdmin);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBeneficiary(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        service.deleteBeneficiary(id, authentication.getName(), isAdmin);
        return ResponseEntity.ok(Map.of("message", "Beneficiary deleted successfully"));
    }
}
