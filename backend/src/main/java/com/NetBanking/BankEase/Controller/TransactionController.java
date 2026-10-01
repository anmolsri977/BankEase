package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.TransferRequest;
import com.NetBanking.BankEase.Entity.Transaction;
import com.NetBanking.BankEase.Service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService service;

    @PostMapping("/transfer")
    public ResponseEntity<?> transfer(@RequestBody TransferRequest request, Authentication authentication) {
        try {
            Transaction transaction = service.transferFunds(request, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Transaction>> getMyTransactions(Authentication authentication) {
        List<Transaction> transactions = service.getMyTransactions(authentication.getName());
        return ResponseEntity.ok(transactions);
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> fetchTransactions() {
        return ResponseEntity.ok(service.getAllTransactions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> fetchTransaction(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Optional<Transaction> txn = service.getTransactionById(id);
        if (txn.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Transaction not found"));
        }

        Transaction transaction = txn.get();
        if (!isAdmin) {
            String email = authentication.getName();
            boolean ownsSender = transaction.getSenderAccount() != null &&
                    transaction.getSenderAccount().getUser() != null &&
                    email.equalsIgnoreCase(transaction.getSenderAccount().getUser().getEmail());
            boolean ownsReceiver = transaction.getReceiverAccount() != null &&
                    transaction.getReceiverAccount().getUser() != null &&
                    email.equalsIgnoreCase(transaction.getReceiverAccount().getUser().getEmail());

            if (!ownsSender && !ownsReceiver) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: You do not have permission to view this transaction"));
            }
        }

        return ResponseEntity.ok(transaction);
    }
}
