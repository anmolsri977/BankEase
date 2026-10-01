package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.CreateInvestmentRequest;
import com.NetBanking.BankEase.Dto.UpdateInvestmentStatusRequest;
import com.NetBanking.BankEase.Entity.Investment;
import com.NetBanking.BankEase.Service.InvestmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    @Autowired
    private InvestmentService service;

    @PostMapping
    public ResponseEntity<?> createInvestment(@RequestBody CreateInvestmentRequest request, Authentication authentication) {
        try {
            Investment investment = service.createInvestment(request, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(investment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Investment>> getMyInvestments(Authentication authentication) {
        List<Investment> investments = service.getMyInvestments(authentication.getName());
        return ResponseEntity.ok(investments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvestmentById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            Investment investment = service.getInvestmentById(id, authentication.getName(), isAdmin);
            return ResponseEntity.ok(investment);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Investment>> getAllInvestments() {
        return ResponseEntity.ok(service.getAllInvestments());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateInvestmentStatus(@PathVariable Long id, @RequestBody UpdateInvestmentStatusRequest request) {
        try {
            Investment investment = service.updateInvestmentStatus(id, request);
            return ResponseEntity.ok(investment);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
