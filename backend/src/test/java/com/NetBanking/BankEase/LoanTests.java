package com.NetBanking.BankEase;

import com.NetBanking.BankEase.Controller.LoanController;
import com.NetBanking.BankEase.Dto.ApplyLoanRequest;
import com.NetBanking.BankEase.Dto.UpdateLoanStatusRequest;
import com.NetBanking.BankEase.Entity.Loan;
import com.NetBanking.BankEase.Entity.Role;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.LoanRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import com.NetBanking.BankEase.Service.LoanService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
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
public class LoanTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private LoanController loanController;

    @Autowired
    private LoanService loanService;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    private User customerA;
    private User customerB;
    private User admin;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        customerA = userRepository.findByEmail("loan_cust_a@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Loan Cust A");
            u.setEmail("loan_cust_a@bankease.com");
            u.setPassword("hashed");
            u.setPhone("1112223334");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        customerB = userRepository.findByEmail("loan_cust_b@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Loan Cust B");
            u.setEmail("loan_cust_b@bankease.com");
            u.setPassword("hashed");
            u.setPhone("5556667778");
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

    // 1. Customer applies for loan -> 201
    // 2. Loan status initially PENDING
    @Test
    void testCustomerAppliesForLoanSuccessfully() throws Exception {
        ApplyLoanRequest request = new ApplyLoanRequest("PERSONAL", new BigDecimal("50000.00"), 12);

        mockMvc.perform(post("/api/loans/apply")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.loanId").isNotEmpty())
                .andExpect(jsonPath("$.loanType").value("PERSONAL"))
                .andExpect(jsonPath("$.amount").value(50000.00))
                .andExpect(jsonPath("$.tenureMonths").value(12))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.interestRate").value(12.0))
                .andExpect(jsonPath("$.applicationDate").isNotEmpty());
    }

    // 3. Invalid loan type -> 400
    @Test
    void testApplyLoanInvalidLoanType() throws Exception {
        ApplyLoanRequest request = new ApplyLoanRequest("LUXURY_BOAT", new BigDecimal("50000.00"), 12);

        mockMvc.perform(post("/api/loans/apply")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid loan type")));
    }

    // 4. Invalid amount -> 400
    @Test
    void testApplyLoanInvalidAmount() throws Exception {
        ApplyLoanRequest requestZero = new ApplyLoanRequest("HOME", BigDecimal.ZERO, 24);
        mockMvc.perform(post("/api/loans/apply")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestZero)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("greater than zero")));

        ApplyLoanRequest requestNegative = new ApplyLoanRequest("HOME", new BigDecimal("-1000.00"), 24);
        mockMvc.perform(post("/api/loans/apply")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestNegative)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("greater than zero")));
    }

    // 5. Invalid tenure -> 400
    @Test
    void testApplyLoanInvalidTenure() throws Exception {
        ApplyLoanRequest requestZero = new ApplyLoanRequest("EDUCATION", new BigDecimal("10000.00"), 0);
        mockMvc.perform(post("/api/loans/apply")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestZero)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("greater than zero")));

        ApplyLoanRequest requestNegative = new ApplyLoanRequest("EDUCATION", new BigDecimal("10000.00"), -12);
        mockMvc.perform(post("/api/loans/apply")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestNegative)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("greater than zero")));
    }

    // 6. Customer views own loans -> 200
    @Test
    void testCustomerViewsOwnLoans() throws Exception {
        ApplyLoanRequest request = new ApplyLoanRequest("VEHICLE", new BigDecimal("25000.00"), 36);
        mockMvc.perform(post("/api/loans/apply")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/loans/my")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$", not(empty())));
    }

    // 7. Customer cannot view another customer's loan -> 403
    @Test
    void testCustomerCannotViewAnotherCustomerLoan() throws Exception {
        Loan loanA = new Loan();
        loanA.setLoanId("LOAN_TEST_A_" + System.currentTimeMillis());
        loanA.setLoanType("HOME");
        loanA.setAmount(new BigDecimal("100000.00"));
        loanA.setInterestRate(8.5);
        loanA.setTenureMonths(120);
        loanA.setStatus("PENDING");
        loanA.setApplicationDate(LocalDateTime.now());
        loanA.setUser(customerA);
        loanA = loanRepository.save(loanA);

        // Customer B tries to view Customer A's loan -> 403
        mockMvc.perform(get("/api/loans/" + loanA.getId())
                        .with(user("loan_cust_b@bankease.com").roles("CUSTOMER")))
                .andExpect(status().isForbidden());

        // Customer A viewing own loan -> 200
        mockMvc.perform(get("/api/loans/" + loanA.getId())
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(loanA.getId()));
    }

    // 8. Admin views all loans -> 200
    @Test
    void testAdminViewsAllLoans() throws Exception {
        mockMvc.perform(get("/api/loans")
                        .with(user("admin@bankease.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    // 9. Admin approves loan -> 200
    @Test
    void testAdminApprovesLoan() throws Exception {
        Loan loan = new Loan();
        loan.setLoanId("LOAN_APPROVE_" + System.currentTimeMillis());
        loan.setLoanType("PERSONAL");
        loan.setAmount(new BigDecimal("30000.00"));
        loan.setInterestRate(12.0);
        loan.setTenureMonths(24);
        loan.setStatus("PENDING");
        loan.setApplicationDate(LocalDateTime.now());
        loan.setUser(customerA);
        loan = loanRepository.save(loan);

        UpdateLoanStatusRequest updateReq = new UpdateLoanStatusRequest("APPROVED", "Verified and approved");

        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.remarks").value("Verified and approved"));

        Loan updated = loanRepository.findById(loan.getId()).orElseThrow();
        assertEquals("APPROVED", updated.getStatus());
    }

    // 10. Admin rejects loan -> 200
    @Test
    void testAdminRejectsLoan() throws Exception {
        Loan loan = new Loan();
        loan.setLoanId("LOAN_REJECT_" + System.currentTimeMillis());
        loan.setLoanType("EDUCATION");
        loan.setAmount(new BigDecimal("15000.00"));
        loan.setInterestRate(9.0);
        loan.setTenureMonths(18);
        loan.setStatus("PENDING");
        loan.setApplicationDate(LocalDateTime.now());
        loan.setUser(customerA);
        loan = loanRepository.save(loan);

        UpdateLoanStatusRequest updateReq = new UpdateLoanStatusRequest("REJECTED", "Insufficient eligibility");

        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.remarks").value("Insufficient eligibility"));

        Loan updated = loanRepository.findById(loan.getId()).orElseThrow();
        assertEquals("REJECTED", updated.getStatus());
    }

    // 11. Customer cannot approve/reject loan -> 403
    @Test
    void testCustomerCannotApproveOrRejectLoan() throws Exception {
        Loan loan = new Loan();
        loan.setLoanId("LOAN_FORBIDDEN_" + System.currentTimeMillis());
        loan.setLoanType("VEHICLE");
        loan.setAmount(new BigDecimal("20000.00"));
        loan.setInterestRate(10.0);
        loan.setTenureMonths(12);
        loan.setStatus("PENDING");
        loan.setApplicationDate(LocalDateTime.now());
        loan.setUser(customerA);
        loan = loanRepository.save(loan);

        UpdateLoanStatusRequest updateReq = new UpdateLoanStatusRequest("APPROVED", "Trying to self approve");

        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("loan_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    // 12. Unauthenticated request -> 401
    @Test
    void testUnauthenticatedRequestsFailWith401() throws Exception {
        mockMvc.perform(get("/api/loans/my"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/loans/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loanType\":\"HOME\",\"amount\":50000,\"tenureMonths\":12}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/loans"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/loans/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"APPROVED\"}"))
                .andExpect(status().isUnauthorized());
    }

    // 13. Invalid status transition -> 400
    @Test
    void testInvalidStatusTransitions() throws Exception {
        Loan loan = new Loan();
        loan.setLoanId("LOAN_TRANSITION_" + System.currentTimeMillis());
        loan.setLoanType("PERSONAL");
        loan.setAmount(new BigDecimal("10000.00"));
        loan.setInterestRate(12.0);
        loan.setTenureMonths(12);
        loan.setStatus("PENDING");
        loan.setApplicationDate(LocalDateTime.now());
        loan.setUser(customerA);
        loan = loanRepository.save(loan);

        // Invalid: PENDING -> ACTIVE (Must be APPROVED first)
        UpdateLoanStatusRequest reqPendingToActive = new UpdateLoanStatusRequest("ACTIVE", "Direct to active");
        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqPendingToActive)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid status transition")));

        // Invalid: PENDING -> CLOSED
        UpdateLoanStatusRequest reqPendingToClosed = new UpdateLoanStatusRequest("CLOSED", "Direct to closed");
        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqPendingToClosed)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid status transition")));

        // Valid: PENDING -> APPROVED
        UpdateLoanStatusRequest reqApprove = new UpdateLoanStatusRequest("APPROVED", "Approved");
        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqApprove)))
                .andExpect(status().isOk());

        // Invalid: APPROVED -> CLOSED (Must be ACTIVE first)
        UpdateLoanStatusRequest reqApprovedToClosed = new UpdateLoanStatusRequest("CLOSED", "Cannot close before active");
        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqApprovedToClosed)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid status transition")));

        // Valid: APPROVED -> ACTIVE
        UpdateLoanStatusRequest reqActive = new UpdateLoanStatusRequest("ACTIVE", "Disbursed and active");
        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqActive)))
                .andExpect(status().isOk());

        // Valid: ACTIVE -> CLOSED
        UpdateLoanStatusRequest reqClosed = new UpdateLoanStatusRequest("CLOSED", "Loan paid and closed");
        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqClosed)))
                .andExpect(status().isOk());

        // Invalid: CLOSED -> ACTIVE
        UpdateLoanStatusRequest reqReopen = new UpdateLoanStatusRequest("ACTIVE", "Trying to reopen");
        mockMvc.perform(put("/api/loans/" + loan.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqReopen)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid status transition")));
    }
}
