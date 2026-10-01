package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Dto.BillPaymentRequest;
import com.NetBanking.BankEase.Entity.Account;
import com.NetBanking.BankEase.Entity.BillPayment;
import com.NetBanking.BankEase.Repository.AccountRepository;
import com.NetBanking.BankEase.Repository.BillPaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class BillPaymentService {

    private static final Set<String> VALID_BILL_TYPES = Set.of("ELECTRICITY", "WATER", "MOBILE", "INTERNET");

    @Autowired
    private BillPaymentRepository repo;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final SecureRandom random = new SecureRandom();

    @Transactional(rollbackFor = Exception.class)
    public BillPayment payBill(BillPaymentRequest request, String authenticatedUserEmail) {
        if (request == null) {
            throw new IllegalArgumentException("Bill payment request cannot be empty");
        }

        if (request.getAccountNumber() == null || request.getAccountNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Account number is required");
        }

        if (request.getBillerName() == null || request.getBillerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Biller name is required");
        }

        if (request.getBillNumber() == null || request.getBillNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Bill number is required");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        if (request.getBillType() == null || request.getBillType().trim().isEmpty()) {
            throw new IllegalArgumentException("Bill type is required");
        }

        String billTypeUpper = request.getBillType().trim().toUpperCase();
        if (!VALID_BILL_TYPES.contains(billTypeUpper)) {
            throw new IllegalArgumentException("Invalid bill type. Supported types: ELECTRICITY, WATER, MOBILE, INTERNET.");
        }

        Account account = accountRepository.findByAccountNumber(request.getAccountNumber().trim())
                .orElseThrow(() -> new IllegalArgumentException("Account not found with account number: " + request.getAccountNumber()));

        // Ownership check
        if (account.getUser() == null || !account.getUser().getEmail().equalsIgnoreCase(authenticatedUserEmail)) {
            throw new AccessDeniedException("Access denied: Account does not belong to the authenticated customer");
        }

        // Account status check
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new IllegalStateException("Account is not ACTIVE. Current status: " + account.getStatus());
        }

        // Balance check
        if (account.getBalance() == null || account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient balance in account");
        }

        // Deduct balance
        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        // Create BillPayment record
        BillPayment payment = new BillPayment();
        payment.setPaymentId(generateUniquePaymentId());
        payment.setBillType(billTypeUpper);
        payment.setBillerName(request.getBillerName().trim());
        payment.setBillNumber(request.getBillNumber().trim());
        payment.setAmount(request.getAmount());
        payment.setStatus("SUCCESS");
        payment.setDescription(request.getDescription());
        payment.setCreatedAt(LocalDateTime.now());
        payment.setPaymentDate(LocalDateTime.now());
        payment.setAccount(account);
        payment.setUser(account.getUser());

        BillPayment saved = repo.save(payment);
        auditLogService.logAction(payment.getUser(), "BILL_PAYMENT", "Paid " + payment.getAmount() + " to " + payment.getBillerName() + " (" + payment.getBillType() + ")");
        return saved;
    }

    private String generateUniquePaymentId() {
        String paymentId;
        do {
            long randomPart = 10000000L + (long) (random.nextDouble() * 90000000L);
            paymentId = "BILL" + System.currentTimeMillis() + randomPart;
        } while (repo.existsByPaymentId(paymentId));
        return paymentId;
    }

    public List<BillPayment> getMyBillPayments(String userEmail) {
        return repo.findByUserEmail(userEmail);
    }

    public List<BillPayment> getAllBillPayments() {
        return repo.findAll();
    }

    public BillPayment getBillPaymentById(Long id, String userEmail, boolean isAdmin) {
        BillPayment payment = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bill payment not found with id: " + id));

        if (!isAdmin) {
            boolean ownsUser = payment.getUser() != null && payment.getUser().getEmail().equalsIgnoreCase(userEmail);
            boolean ownsAccount = payment.getAccount() != null &&
                    payment.getAccount().getUser() != null &&
                    payment.getAccount().getUser().getEmail().equalsIgnoreCase(userEmail);

            if (!ownsUser && !ownsAccount) {
                throw new AccessDeniedException("Access denied: You do not have permission to view this bill payment");
            }
        }

        return payment;
    }
}
