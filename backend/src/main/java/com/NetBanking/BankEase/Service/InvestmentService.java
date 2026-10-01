package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Dto.CreateInvestmentRequest;
import com.NetBanking.BankEase.Dto.UpdateInvestmentStatusRequest;
import com.NetBanking.BankEase.Entity.Investment;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.InvestmentRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class InvestmentService {

    private static final Set<String> VALID_INVESTMENT_TYPES = Set.of("FD", "RD", "MUTUAL_FUND", "STOCK");
    private static final Set<String> VALID_INVESTMENT_STATUSES = Set.of("ACTIVE", "MATURED", "CLOSED");

    @Autowired
    private InvestmentRepository repo;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final SecureRandom random = new SecureRandom();

    @Transactional(rollbackFor = Exception.class)
    public Investment createInvestment(CreateInvestmentRequest request, String authenticatedUserEmail) {
        if (request == null) {
            throw new IllegalArgumentException("Investment request cannot be empty");
        }

        if (request.getInvestmentType() == null || request.getInvestmentType().trim().isEmpty()) {
            throw new IllegalArgumentException("Investment type is required");
        }

        String investmentTypeUpper = request.getInvestmentType().trim().toUpperCase();
        if (!VALID_INVESTMENT_TYPES.contains(investmentTypeUpper)) {
            throw new IllegalArgumentException("Invalid investment type. Supported types: FD, RD, MUTUAL_FUND, STOCK");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Investment amount must be greater than zero");
        }

        if (request.getTenureMonths() == null || request.getTenureMonths() <= 0) {
            throw new IllegalArgumentException("Tenure months must be greater than zero");
        }

        User user = userRepository.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authenticatedUserEmail));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime maturityDate = now.plusMonths(request.getTenureMonths());
        BigDecimal calculatedReturns = calculateReturns(request.getAmount(), investmentTypeUpper, request.getTenureMonths());

        Investment investment = new Investment();
        investment.setInvestmentId(generateUniqueInvestmentId());
        investment.setInvestmentType(investmentTypeUpper);
        investment.setAmount(request.getAmount());
        investment.setStatus("ACTIVE");
        investment.setInvestmentDate(now);
        investment.setMaturityDate(maturityDate);
        investment.setReturns(calculatedReturns);
        investment.setUser(user);

        Investment saved = repo.save(investment);
        auditLogService.logAction(user, "INVESTMENT_CREATED", "Created " + saved.getInvestmentType() + " investment of " + saved.getAmount());
        return saved;
    }

    private String generateUniqueInvestmentId() {
        String investmentId;
        do {
            long randomPart = 10000000L + (long) (random.nextDouble() * 90000000L);
            investmentId = "INV" + System.currentTimeMillis() + randomPart;
        } while (repo.existsByInvestmentId(investmentId));
        return investmentId;
    }

    private double getAnnualReturnRate(String type) {
        switch (type) {
            case "FD":
                return 7.0;
            case "RD":
                return 6.5;
            case "MUTUAL_FUND":
                return 12.0;
            case "STOCK":
                return 15.0;
            default:
                return 7.0;
        }
    }

    private BigDecimal calculateReturns(BigDecimal amount, String investmentType, int tenureMonths) {
        double rate = getAnnualReturnRate(investmentType);
        return amount.multiply(BigDecimal.valueOf(rate))
                .multiply(BigDecimal.valueOf(tenureMonths))
                .divide(BigDecimal.valueOf(1200), 2, RoundingMode.HALF_UP);
    }

    public List<Investment> getMyInvestments(String userEmail) {
        return repo.findByUserEmail(userEmail);
    }

    public List<Investment> getAllInvestments() {
        return repo.findAll();
    }

    public Investment getInvestmentById(Long id, String userEmail, boolean isAdmin) {
        Investment investment = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Investment not found with id: " + id));

        if (!isAdmin) {
            if (investment.getUser() == null || !investment.getUser().getEmail().equalsIgnoreCase(userEmail)) {
                throw new AccessDeniedException("Access denied: You do not have permission to view this investment");
            }
        }

        return investment;
    }

    @Transactional(rollbackFor = Exception.class)
    public Investment updateInvestmentStatus(Long id, UpdateInvestmentStatusRequest request) {
        Investment investment = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Investment not found with id: " + id));

        if (request == null || request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }

        String targetStatus = request.getStatus().trim().toUpperCase();
        if (!VALID_INVESTMENT_STATUSES.contains(targetStatus)) {
            throw new IllegalArgumentException("Invalid investment status. Supported statuses: ACTIVE, MATURED, CLOSED");
        }

        investment.setStatus(targetStatus);
        Investment saved = repo.save(investment);
        auditLogService.logAction(saved.getUser(), "INVESTMENT_STATUS_UPDATED", "Investment " + saved.getInvestmentId() + " status updated to " + targetStatus);
        return saved;
    }
}
