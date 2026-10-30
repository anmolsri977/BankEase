package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.CreateInvestmentRequest;
import com.NetBanking.BankEase.Dto.UpdateInvestmentStatusRequest;
import com.NetBanking.BankEase.Entity.Investment;
import com.NetBanking.BankEase.Service.InvestmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    @Autowired
    private InvestmentService service;

    @PostMapping
    public ResponseEntity<Investment> createInvestment(@Valid @RequestBody CreateInvestmentRequest request, Authentication authentication) {
        Investment investment = service.createInvestment(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(investment);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Investment>> getMyInvestments(Authentication authentication) {
        List<Investment> investments = service.getMyInvestments(authentication.getName());
        return ResponseEntity.ok(investments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Investment> getInvestmentById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Investment investment = service.getInvestmentById(id, authentication.getName(), isAdmin);
        return ResponseEntity.ok(investment);
    }

    @GetMapping
    public ResponseEntity<List<Investment>> getAllInvestments() {
        return ResponseEntity.ok(service.getAllInvestments());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Investment> updateInvestmentStatus(@PathVariable Long id, @Valid @RequestBody UpdateInvestmentStatusRequest request) {
        Investment investment = service.updateInvestmentStatus(id, request);
        return ResponseEntity.ok(investment);
    }
}
