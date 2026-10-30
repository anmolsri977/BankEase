package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.ApplyLoanRequest;
import com.NetBanking.BankEase.Dto.UpdateLoanStatusRequest;
import com.NetBanking.BankEase.Entity.Loan;
import com.NetBanking.BankEase.Service.LoanService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService service;

    @PostMapping("/apply")
    public ResponseEntity<Loan> applyLoan(@Valid @RequestBody ApplyLoanRequest request, Authentication authentication) {
        Loan loan = service.applyLoan(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(loan);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Loan>> getMyLoans(Authentication authentication) {
        List<Loan> loans = service.getMyLoans(authentication.getName());
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Loan> getLoanById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Loan loan = service.getLoanById(id, authentication.getName(), isAdmin);
        return ResponseEntity.ok(loan);
    }

    @GetMapping
    public ResponseEntity<List<Loan>> getAllLoans() {
        return ResponseEntity.ok(service.getAllLoans());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Loan> updateLoanStatus(@PathVariable Long id, @Valid @RequestBody UpdateLoanStatusRequest request) {
        Loan loan = service.updateLoanStatus(id, request);
        return ResponseEntity.ok(loan);
    }
}
