package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Dto.CreateAccountRequest;
import com.NetBanking.BankEase.Entity.Account;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.AccountRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountService {

    @Autowired
    private AccountRepository repo;

    @Autowired
    private UserRepository userRepository;

    private final SecureRandom random = new SecureRandom();

    public Account createAccount(CreateAccountRequest request, String userEmail) {
        if (request == null || request.getAccountType() == null || request.getAccountType().trim().isEmpty()) {
            throw new IllegalArgumentException("Account type is required");
        }

        String type = request.getAccountType().trim().toUpperCase();
        if (!type.equals("SAVINGS") && !type.equals("CURRENT")) {
            throw new IllegalArgumentException("Invalid account type. Must be SAVINGS or CURRENT.");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + userEmail));

        String accountNumber = generateUniqueAccountNumber();

        Account account = new Account();
        account.setAccountNumber(accountNumber);
        account.setAccountType(type);
        account.setBalance(BigDecimal.ZERO);
        account.setStatus("ACTIVE");
        account.setCreatedAt(LocalDateTime.now());
        account.setUser(user);

        return repo.save(account);
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            // Generate a 12-digit account number starting with a non-zero digit
            long firstPart = 100000 + random.nextInt(900000);
            long secondPart = 100000 + random.nextInt(900000);
            accountNumber = "" + firstPart + secondPart;
        } while (repo.existsByAccountNumber(accountNumber));

        return accountNumber;
    }

    public List<Account> getAccountsByUserEmail(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + userEmail));
        return repo.findByUser(user);
    }

    public List<Account> getAllAccounts() {
        return repo.findAll();
    }

    public Account getAccountById(Long id, String userEmail, boolean isAdmin) {
        Account account = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + id));

        if (!isAdmin && (account.getUser() == null || !account.getUser().getEmail().equals(userEmail))) {
            throw new AccessDeniedException("Access denied: You do not have permission to view this account");
        }

        return account;
    }

    public Account updateAccountStatus(Long id, String status) {
        Account account = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + id));

        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be empty");
        }

        String upperStatus = status.trim().toUpperCase();
        if (!upperStatus.equals("ACTIVE") && !upperStatus.equals("BLOCKED") && !upperStatus.equals("CLOSED")) {
            throw new IllegalArgumentException("Invalid status. Must be ACTIVE, BLOCKED, or CLOSED.");
        }

        account.setStatus(upperStatus);
        return repo.save(account);
    }

    public void deleteAccount(Long id) {
        if (!repo.existsById(id)) {
            throw new IllegalArgumentException("Account not found with id: " + id);
        }
        repo.deleteById(id);
    }
}
