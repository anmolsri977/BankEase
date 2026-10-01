package com.NetBanking.BankEase;

import com.NetBanking.BankEase.Dto.ApplyLoanRequest;
import com.NetBanking.BankEase.Dto.CreateAccountRequest;
import com.NetBanking.BankEase.Dto.CreateBeneficiaryRequest;
import com.NetBanking.BankEase.Dto.CreateInvestmentRequest;
import com.NetBanking.BankEase.Dto.UpdateInvestmentStatusRequest;
import com.NetBanking.BankEase.Dto.UpdateLoanStatusRequest;
import com.NetBanking.BankEase.Entity.Account;
import com.NetBanking.BankEase.Entity.AuditLog;
import com.NetBanking.BankEase.Entity.Investment;
import com.NetBanking.BankEase.Entity.Loan;
import com.NetBanking.BankEase.Entity.Role;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.AuditLogRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import com.NetBanking.BankEase.Service.AccountService;
import com.NetBanking.BankEase.Service.AuditLogService;
import com.NetBanking.BankEase.Service.BeneficiaryService;
import com.NetBanking.BankEase.Service.InvestmentService;
import com.NetBanking.BankEase.Service.LoanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class AuditLogTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountService accountService;

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private LoanService loanService;

    @Autowired
    private InvestmentService investmentService;

    private MockMvc mockMvc;

    private User customerA;
    private User customerB;
    private User admin;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        customerA = userRepository.findByEmail("audit_cust_a@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Audit Cust A");
            u.setEmail("audit_cust_a@bankease.com");
            u.setPassword("hashed");
            u.setPhone("1122334455");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        customerB = userRepository.findByEmail("audit_cust_b@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Audit Cust B");
            u.setEmail("audit_cust_b@bankease.com");
            u.setPassword("hashed");
            u.setPhone("5544332211");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        admin = userRepository.findByEmail("admin@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Admin");
            u.setEmail("admin@bankease.com");
            u.setPassword("hashed");
            u.setPhone("9998887776");
            u.setRole(Role.ADMIN);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });
    }

    // 1. Customer can view own logs
    @Test
    void testCustomerCanViewOwnLogs() throws Exception {
        auditLogService.logAction(customerA, "LOGIN", "Customer A logged in");

        mockMvc.perform(get("/api/audit-logs/my")
                        .with(user("audit_cust_a@bankease.com").roles("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(List.class)))
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].action").isNotEmpty());
    }

    // 2. Customer cannot access all logs (HTTP 403)
    @Test
    void testCustomerCannotAccessAllLogs() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                        .with(user("audit_cust_a@bankease.com").roles("CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    // 3. Admin can view all logs (HTTP 200)
    @Test
    void testAdminCanViewAllLogs() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                        .with(user("admin@bankease.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(List.class)));
    }

    // 4. Unauthenticated request returns 401
    @Test
    void testUnauthenticatedRequestsFailWith401() throws Exception {
        mockMvc.perform(get("/api/audit-logs/my"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isUnauthorized());
    }

    // 5. Important operations generate audit records
    @Test
    void testImportantOperationsGenerateAuditRecords() {
        // Account creation
        CreateAccountRequest accReq = new CreateAccountRequest("SAVINGS");
        Account acc = accountService.createAccount(accReq, customerA.getEmail());
        assertNotNull(acc);
        List<AuditLog> accLogs = auditLogRepository.findByUserEmail(customerA.getEmail());
        assertTrue(accLogs.stream().anyMatch(l -> "ACCOUNT_CREATED".equals(l.getAction())));

        // Beneficiary addition
        CreateBeneficiaryRequest benReq = new CreateBeneficiaryRequest("Ben One", "123456789012", "HDFC Bank", "HDFC0001234");
        beneficiaryService.createBeneficiary(benReq, customerA.getEmail());
        List<AuditLog> benLogs = auditLogRepository.findByUserEmail(customerA.getEmail());
        assertTrue(benLogs.stream().anyMatch(l -> "BENEFICIARY_ADDED".equals(l.getAction())));

        // Loan applied
        ApplyLoanRequest loanReq = new ApplyLoanRequest("PERSONAL", new BigDecimal("10000.00"), 12);
        Loan loan = loanService.applyLoan(loanReq, customerA.getEmail());
        assertNotNull(loan);
        List<AuditLog> loanLogs = auditLogRepository.findByUserEmail(customerA.getEmail());
        assertTrue(loanLogs.stream().anyMatch(l -> "LOAN_APPLIED".equals(l.getAction())));

        // Loan status updated
        UpdateLoanStatusRequest loanStatusReq = new UpdateLoanStatusRequest("APPROVED", "Approved for test");
        loanService.updateLoanStatus(loan.getId(), loanStatusReq);
        List<AuditLog> loanUpdateLogs = auditLogRepository.findByUserEmail(customerA.getEmail());
        assertTrue(loanUpdateLogs.stream().anyMatch(l -> "LOAN_STATUS_UPDATED".equals(l.getAction())));

        // Investment created
        CreateInvestmentRequest invReq = new CreateInvestmentRequest("FD", new BigDecimal("5000.00"), 12);
        Investment inv = investmentService.createInvestment(invReq, customerA.getEmail());
        assertNotNull(inv);
        List<AuditLog> invLogs = auditLogRepository.findByUserEmail(customerA.getEmail());
        assertTrue(invLogs.stream().anyMatch(l -> "INVESTMENT_CREATED".equals(l.getAction())));

        // Investment status updated
        UpdateInvestmentStatusRequest invStatusReq = new UpdateInvestmentStatusRequest("CLOSED");
        investmentService.updateInvestmentStatus(inv.getId(), invStatusReq);
        List<AuditLog> invUpdateLogs = auditLogRepository.findByUserEmail(customerA.getEmail());
        assertTrue(invUpdateLogs.stream().anyMatch(l -> "INVESTMENT_STATUS_UPDATED".equals(l.getAction())));
    }
}
