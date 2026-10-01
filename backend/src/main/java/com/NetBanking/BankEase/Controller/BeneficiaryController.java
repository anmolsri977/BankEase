package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.CreateBeneficiaryRequest;
import com.NetBanking.BankEase.Entity.Beneficiary;
import com.NetBanking.BankEase.Service.BeneficiaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
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
    public ResponseEntity<?> createBeneficiary(@RequestBody CreateBeneficiaryRequest request, Authentication authentication) {
        try {
            Beneficiary beneficiary = service.createBeneficiary(request, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(beneficiary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
    public ResponseEntity<?> getBeneficiaryById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            Beneficiary beneficiary = service.getBeneficiaryById(id, authentication.getName(), isAdmin);
            return ResponseEntity.ok(beneficiary);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBeneficiary(@PathVariable Long id, @RequestBody CreateBeneficiaryRequest request, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            Beneficiary updated = service.updateBeneficiary(id, request, authentication.getName(), isAdmin);
            return ResponseEntity.ok(updated);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBeneficiary(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            service.deleteBeneficiary(id, authentication.getName(), isAdmin);
            return ResponseEntity.ok(Map.of("message", "Beneficiary deleted successfully"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
