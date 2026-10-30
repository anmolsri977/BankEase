package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.CreateAccountRequest;
import com.NetBanking.BankEase.Entity.Account;
import com.NetBanking.BankEase.Service.AccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountService service;

    @PostMapping
    public ResponseEntity<Account> createAccount(@Valid @RequestBody CreateAccountRequest request, Authentication authentication) {
        Account account = service.createAccount(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Account>> getMyAccounts(Authentication authentication) {
        List<Account> accounts = service.getAccountsByUserEmail(authentication.getName());
        return ResponseEntity.ok(accounts);
    }

    @GetMapping
    public ResponseEntity<List<Account>> fetchAllAccounts() {
        return ResponseEntity.ok(service.getAllAccounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> fetchAccount(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Account account = service.getAccountById(id, authentication.getName(), isAdmin);
        return ResponseEntity.ok(account);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Account> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Account updated = service.updateAccountStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAnAccount(@PathVariable Long id) {
        service.deleteAccount(id);
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }
}
