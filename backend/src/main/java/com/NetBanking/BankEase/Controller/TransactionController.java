package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.TransferRequest;
import com.NetBanking.BankEase.Entity.Transaction;
import com.NetBanking.BankEase.Exception.ResourceNotFoundException;
import com.NetBanking.BankEase.Service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService service;

    @PostMapping("/transfer")
    public ResponseEntity<Transaction> transfer(@Valid @RequestBody TransferRequest request, Authentication authentication) {
        Transaction transaction = service.transferFunds(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
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
    public ResponseEntity<Transaction> fetchTransaction(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Transaction transaction = service.getTransactionById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        if (!isAdmin) {
            String email = authentication.getName();
            boolean ownsSender = transaction.getSenderAccount() != null &&
                    transaction.getSenderAccount().getUser() != null &&
                    email.equalsIgnoreCase(transaction.getSenderAccount().getUser().getEmail());
            boolean ownsReceiver = transaction.getReceiverAccount() != null &&
                    transaction.getReceiverAccount().getUser() != null &&
                    email.equalsIgnoreCase(transaction.getReceiverAccount().getUser().getEmail());

            if (!ownsSender && !ownsReceiver) {
                throw new AccessDeniedException("Access denied: You do not have permission to view this transaction");
            }
        }

        return ResponseEntity.ok(transaction);
    }
}
