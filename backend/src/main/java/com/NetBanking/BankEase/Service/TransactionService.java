package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Dto.TransferRequest;
import com.NetBanking.BankEase.Entity.Account;
import com.NetBanking.BankEase.Entity.Transaction;
import com.NetBanking.BankEase.Repository.AccountRepository;
import com.NetBanking.BankEase.Repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository repo;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final SecureRandom random = new SecureRandom();

    @Transactional(rollbackFor = Exception.class)
    public Transaction transferFunds(TransferRequest request, String authenticatedUserEmail) {
        if (request == null) {
            throw new IllegalArgumentException("Transfer request cannot be empty");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero");
        }

        if (request.getSenderAccountNumber() == null || request.getSenderAccountNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Sender account number is required");
        }

        if (request.getReceiverAccountNumber() == null || request.getReceiverAccountNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Receiver account number is required");
        }

        String senderAccNum = request.getSenderAccountNumber().trim();
        String receiverAccNum = request.getReceiverAccountNumber().trim();

        if (senderAccNum.equalsIgnoreCase(receiverAccNum)) {
            throw new IllegalArgumentException("Sender and receiver cannot be the same account");
        }

        Account sender = accountRepository.findByAccountNumber(senderAccNum)
                .orElseThrow(() -> new IllegalArgumentException("Sender account not found with account number: " + senderAccNum));

        Account receiver = accountRepository.findByAccountNumber(receiverAccNum)
                .orElseThrow(() -> new IllegalArgumentException("Receiver account not found with account number: " + receiverAccNum));

        // Ownership check
        if (sender.getUser() == null || !sender.getUser().getEmail().equalsIgnoreCase(authenticatedUserEmail)) {
            throw new AccessDeniedException("Access denied: Sender account does not belong to the authenticated customer");
        }

        // Account status check
        if (!"ACTIVE".equalsIgnoreCase(sender.getStatus())) {
            throw new IllegalStateException("Sender account is not ACTIVE. Current status: " + sender.getStatus());
        }

        if (!"ACTIVE".equalsIgnoreCase(receiver.getStatus())) {
            throw new IllegalStateException("Receiver account is not ACTIVE. Current status: " + receiver.getStatus());
        }

        // Balance check
        if (sender.getBalance() == null || sender.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient balance in sender account");
        }

        // Perform balance updates
        sender.setBalance(sender.getBalance().subtract(request.getAmount()));
        receiver.setBalance(receiver.getBalance().add(request.getAmount()));

        accountRepository.save(sender);
        accountRepository.save(receiver);

        // Record transaction
        Transaction transaction = new Transaction();
        transaction.setTransactionId(generateUniqueTransactionId());
        transaction.setTransactionType("TRANSFER");
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setStatus("SUCCESS");
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setSenderAccount(sender);
        transaction.setReceiverAccount(receiver);
        transaction.setAccount(sender);

        Transaction saved = repo.save(transaction);
        auditLogService.logAction(sender.getUser(), "FUND_TRANSFER", "Transferred " + request.getAmount() + " from " + sender.getAccountNumber() + " to " + receiver.getAccountNumber());
        return saved;
    }

    private String generateUniqueTransactionId() {
        String txnId;
        do {
            long randomPart = 10000000L + (long)(random.nextDouble() * 90000000L);
            txnId = "TXN" + System.currentTimeMillis() + randomPart;
        } while (repo.existsByTransactionId(txnId));
        return txnId;
    }

    public List<Transaction> getMyTransactions(String userEmail) {
        return repo.findByUserEmail(userEmail);
    }

    public List<Transaction> getAllTransactions() {
        return repo.findAll();
    }

    public Optional<Transaction> getTransactionById(Long id) {
        return repo.findById(id);
    }
}
