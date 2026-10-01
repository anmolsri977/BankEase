package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.ApplyLoanRequest;
import com.NetBanking.BankEase.Dto.UpdateLoanStatusRequest;
import com.NetBanking.BankEase.Entity.Loan;
import com.NetBanking.BankEase.Service.LoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService service;

    @PostMapping("/apply")
    public ResponseEntity<?> applyLoan(@RequestBody ApplyLoanRequest request, Authentication authentication) {
        try {
            Loan loan = service.applyLoan(request, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(loan);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Loan>> getMyLoans(Authentication authentication) {
        List<Loan> loans = service.getMyLoans(authentication.getName());
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLoanById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            Loan loan = service.getLoanById(id, authentication.getName(), isAdmin);
            return ResponseEntity.ok(loan);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Loan>> getAllLoans() {
        return ResponseEntity.ok(service.getAllLoans());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateLoanStatus(@PathVariable Long id, @RequestBody UpdateLoanStatusRequest request) {
        try {
            Loan loan = service.updateLoanStatus(id, request);
            return ResponseEntity.ok(loan);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
