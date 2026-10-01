package com.NetBanking.BankEase;

import com.NetBanking.BankEase.Dto.CreateInvestmentRequest;
import com.NetBanking.BankEase.Dto.UpdateInvestmentStatusRequest;
import com.NetBanking.BankEase.Entity.Investment;
import com.NetBanking.BankEase.Entity.Role;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.InvestmentRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class InvestmentTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private InvestmentRepository investmentRepository;

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

        customerA = userRepository.findByEmail("inv_cust_a@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Inv Cust A");
            u.setEmail("inv_cust_a@bankease.com");
            u.setPassword("hashed");
            u.setPhone("1112223334");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        customerB = userRepository.findByEmail("inv_cust_b@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Inv Cust B");
            u.setEmail("inv_cust_b@bankease.com");
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

    // 1. Successful investment creation
    @Test
    void testSuccessfulInvestmentCreation() throws Exception {
        CreateInvestmentRequest request = new CreateInvestmentRequest("FD", new BigDecimal("10000.00"), 12);

        mockMvc.perform(post("/api/investments")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.investmentId").isNotEmpty())
                .andExpect(jsonPath("$.investmentType").value("FD"))
                .andExpect(jsonPath("$.amount").value(10000.00))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.investmentDate").isNotEmpty())
                .andExpect(jsonPath("$.maturityDate").isNotEmpty())
                .andExpect(jsonPath("$.returns").value(700.00));
    }

    // 2. Invalid investment type
    @Test
    void testInvalidInvestmentType() throws Exception {
        CreateInvestmentRequest request = new CreateInvestmentRequest("CRYPTO", new BigDecimal("10000.00"), 12);

        mockMvc.perform(post("/api/investments")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid investment type")));
    }

    // 3. Amount <= 0
    @Test
    void testAmountZeroOrNegative() throws Exception {
        CreateInvestmentRequest zeroReq = new CreateInvestmentRequest("RD", BigDecimal.ZERO, 12);
        mockMvc.perform(post("/api/investments")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(zeroReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("greater than zero")));

        CreateInvestmentRequest negReq = new CreateInvestmentRequest("RD", new BigDecimal("-500.00"), 12);
        mockMvc.perform(post("/api/investments")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(negReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("greater than zero")));
    }

    // 4. Tenure <= 0
    @Test
    void testTenureZeroOrNegative() throws Exception {
        CreateInvestmentRequest zeroReq = new CreateInvestmentRequest("MUTUAL_FUND", new BigDecimal("5000.00"), 0);
        mockMvc.perform(post("/api/investments")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(zeroReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("greater than zero")));

        CreateInvestmentRequest negReq = new CreateInvestmentRequest("MUTUAL_FUND", new BigDecimal("5000.00"), -6);
        mockMvc.perform(post("/api/investments")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(negReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("greater than zero")));
    }

    // 5. Customer views own investments
    @Test
    void testCustomerViewsOwnInvestments() throws Exception {
        CreateInvestmentRequest request = new CreateInvestmentRequest("STOCK", new BigDecimal("20000.00"), 24);
        mockMvc.perform(post("/api/investments")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/investments/my")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$", not(empty())));
    }

    // 6. Customer cannot view another customer's investment
    @Test
    void testCustomerCannotViewAnotherCustomerInvestment() throws Exception {
        Investment investmentA = new Investment();
        investmentA.setInvestmentId("INV_TEST_A_" + System.currentTimeMillis());
        investmentA.setInvestmentType("FD");
        investmentA.setAmount(new BigDecimal("15000.00"));
        investmentA.setStatus("ACTIVE");
        investmentA.setInvestmentDate(LocalDateTime.now());
        investmentA.setMaturityDate(LocalDateTime.now().plusMonths(12));
        investmentA.setReturns(new BigDecimal("1050.00"));
        investmentA.setUser(customerA);
        investmentA = investmentRepository.save(investmentA);

        // Customer B tries to view Customer A's investment -> 403
        mockMvc.perform(get("/api/investments/" + investmentA.getId())
                        .with(user("inv_cust_b@bankease.com").roles("CUSTOMER")))
                .andExpect(status().isForbidden());

        // Customer A can view own investment -> 200
        mockMvc.perform(get("/api/investments/" + investmentA.getId())
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(investmentA.getId()));
    }

    // 7. Admin views all investments
    @Test
    void testAdminViewsAllInvestments() throws Exception {
        mockMvc.perform(get("/api/investments")
                        .with(user("admin@bankease.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    // 8. Admin updates investment status
    @Test
    void testAdminUpdatesInvestmentStatus() throws Exception {
        Investment investment = new Investment();
        investment.setInvestmentId("INV_ADMIN_UPD_" + System.currentTimeMillis());
        investment.setInvestmentType("RD");
        investment.setAmount(new BigDecimal("8000.00"));
        investment.setStatus("ACTIVE");
        investment.setInvestmentDate(LocalDateTime.now());
        investment.setMaturityDate(LocalDateTime.now().plusMonths(12));
        investment.setReturns(new BigDecimal("520.00"));
        investment.setUser(customerA);
        investment = investmentRepository.save(investment);

        UpdateInvestmentStatusRequest updateReq = new UpdateInvestmentStatusRequest("MATURED");

        mockMvc.perform(put("/api/investments/" + investment.getId() + "/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MATURED"));

        Investment updated = investmentRepository.findById(investment.getId()).orElseThrow();
        assertEquals("MATURED", updated.getStatus());
    }

    // 9. Customer cannot update status
    @Test
    void testCustomerCannotUpdateInvestmentStatus() throws Exception {
        Investment investment = new Investment();
        investment.setInvestmentId("INV_FORBIDDEN_" + System.currentTimeMillis());
        investment.setInvestmentType("STOCK");
        investment.setAmount(new BigDecimal("30000.00"));
        investment.setStatus("ACTIVE");
        investment.setInvestmentDate(LocalDateTime.now());
        investment.setMaturityDate(LocalDateTime.now().plusMonths(36));
        investment.setReturns(new BigDecimal("13500.00"));
        investment.setUser(customerA);
        investment = investmentRepository.save(investment);

        UpdateInvestmentStatusRequest updateReq = new UpdateInvestmentStatusRequest("CLOSED");

        mockMvc.perform(put("/api/investments/" + investment.getId() + "/status")
                        .with(user("inv_cust_a@bankease.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    // 10. Unauthenticated request returns 401
    @Test
    void testUnauthenticatedRequestsFailWith401() throws Exception {
        mockMvc.perform(get("/api/investments/my"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/investments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"investmentType\":\"FD\",\"amount\":5000,\"tenureMonths\":12}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/investments"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/investments/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CLOSED\"}"))
                .andExpect(status().isUnauthorized());
    }

    // 11. Invalid investment ID returns 404
    @Test
    void testInvalidInvestmentIdReturns404() throws Exception {
        mockMvc.perform(get("/api/investments/999999")
                        .with(user("admin@bankease.com").roles("ADMIN")))
                .andExpect(status().isNotFound());

        UpdateInvestmentStatusRequest updateReq = new UpdateInvestmentStatusRequest("CLOSED");
        mockMvc.perform(put("/api/investments/999999/status")
                        .with(user("admin@bankease.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());
    }
}
