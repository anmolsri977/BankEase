package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Dto.ApplyLoanRequest;
import com.NetBanking.BankEase.Dto.UpdateLoanStatusRequest;
import com.NetBanking.BankEase.Entity.Loan;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.LoanRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class LoanService {

    private static final Set<String> VALID_LOAN_TYPES = Set.of("PERSONAL", "HOME", "EDUCATION", "VEHICLE");

    @Autowired
    private LoanRepository repo;

    @Autowired
    private UserRepository userRepository;

    private final SecureRandom random = new SecureRandom();

    @Transactional(rollbackFor = Exception.class)
    public Loan applyLoan(ApplyLoanRequest request, String authenticatedUserEmail) {
        if (request == null) {
            throw new IllegalArgumentException("Loan application request cannot be empty");
        }

        if (request.getLoanType() == null || request.getLoanType().trim().isEmpty()) {
            throw new IllegalArgumentException("Loan type is required");
        }

        String loanTypeUpper = request.getLoanType().trim().toUpperCase();
        if (!VALID_LOAN_TYPES.contains(loanTypeUpper)) {
            throw new IllegalArgumentException("Invalid loan type. Supported types: PERSONAL, HOME, EDUCATION, VEHICLE");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Loan amount must be greater than zero");
        }

        if (request.getTenureMonths() == null || request.getTenureMonths() <= 0) {
            throw new IllegalArgumentException("Tenure months must be greater than zero");
        }

        User user = userRepository.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authenticatedUserEmail));

        Loan loan = new Loan();
        loan.setLoanId(generateUniqueLoanId());
        loan.setLoanType(loanTypeUpper);
        loan.setAmount(request.getAmount());
        loan.setInterestRate(getInterestRateForLoanType(loanTypeUpper));
        loan.setTenureMonths(request.getTenureMonths());
        loan.setStatus("PENDING");
        loan.setApplicationDate(LocalDateTime.now());
        loan.setUser(user);

        return repo.save(loan);
    }

    private String generateUniqueLoanId() {
        String loanId;
        do {
            long randomPart = 10000000L + (long) (random.nextDouble() * 90000000L);
            loanId = "LOAN" + System.currentTimeMillis() + randomPart;
        } while (repo.existsByLoanId(loanId));
        return loanId;
    }

    private Double getInterestRateForLoanType(String loanType) {
        switch (loanType) {
            case "HOME":
                return 8.5;
            case "EDUCATION":
                return 9.0;
            case "VEHICLE":
                return 10.0;
            case "PERSONAL":
                return 12.0;
            default:
                return 10.0;
        }
    }

    public List<Loan> getMyLoans(String userEmail) {
        return repo.findByUserEmail(userEmail);
    }

    public List<Loan> getAllLoans() {
        return repo.findAll();
    }

    public Loan getLoanById(Long id, String userEmail, boolean isAdmin) {
        Loan loan = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan not found with id: " + id));

        if (!isAdmin) {
            if (loan.getUser() == null || !loan.getUser().getEmail().equalsIgnoreCase(userEmail)) {
                throw new AccessDeniedException("Access denied: You do not have permission to view this loan");
            }
        }

        return loan;
    }

    @Transactional(rollbackFor = Exception.class)
    public Loan updateLoanStatus(Long id, UpdateLoanStatusRequest request) {
        Loan loan = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan not found with id: " + id));

        if (request == null || request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }

        String targetStatus = request.getStatus().trim().toUpperCase();
        String currentStatus = loan.getStatus() != null ? loan.getStatus().trim().toUpperCase() : "";

        boolean validTransition = false;
        if ("PENDING".equals(currentStatus) && ("APPROVED".equals(targetStatus) || "REJECTED".equals(targetStatus))) {
            validTransition = true;
        } else if ("APPROVED".equals(currentStatus) && "ACTIVE".equals(targetStatus)) {
            validTransition = true;
        } else if ("ACTIVE".equals(currentStatus) && "CLOSED".equals(targetStatus)) {
            validTransition = true;
        }

        if (!validTransition) {
            throw new IllegalArgumentException("Invalid status transition from " + currentStatus + " to " + targetStatus);
        }

        loan.setStatus(targetStatus);
        if (request.getRemarks() != null) {
            loan.setRemarks(request.getRemarks());
        }

        return repo.save(loan);
    }
}
