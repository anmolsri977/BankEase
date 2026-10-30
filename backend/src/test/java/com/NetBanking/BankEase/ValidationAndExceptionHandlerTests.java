package com.NetBanking.BankEase;

import com.NetBanking.BankEase.Dto.*;
import com.NetBanking.BankEase.Entity.Role;
import com.NetBanking.BankEase.Entity.User;
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
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class ValidationAndExceptionHandlerTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User testCustomer;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
        objectMapper = new ObjectMapper();

        testCustomer = userRepository.findByEmail("validation_test_user@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Validation Tester");
            u.setEmail("validation_test_user@bankease.com");
            u.setPassword("hashedpassword123");
            u.setPhone("9876543210");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });
    }

    // 1. Registration DTO Validation
    @Test
    void testRegisterWithBlankFields_ReturnsBadRequestWithValidationErrors() throws Exception {
        RegisterRequest req = new RegisterRequest("", "", "", "", "");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.error").isNotEmpty())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.errors.name").isNotEmpty())
                .andExpect(jsonPath("$.errors.email").isNotEmpty())
                .andExpect(jsonPath("$.errors.password").isNotEmpty());
    }

    @Test
    void testRegisterWithInvalidEmailFormat_ReturnsBadRequest() throws Exception {
        RegisterRequest req = new RegisterRequest("Valid Name", "invalid-email-string", "password123", "9876543210", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.email", containsString("email")));
    }

    @Test
    void testRegisterWithShortPassword_ReturnsBadRequest() throws Exception {
        RegisterRequest req = new RegisterRequest("Valid Name", "valid@email.com", "123", "9876543210", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.password", containsString("at least 6 characters")));
    }

    @Test
    void testRegisterWithInvalidPhone_ReturnsBadRequest() throws Exception {
        RegisterRequest req = new RegisterRequest("Valid Name", "valid@email.com", "password123", "12345", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.phone", containsString("Invalid phone number")));
    }

    // 2. Login DTO Validation
    @Test
    void testLoginWithBlankCredentials_ReturnsBadRequest() throws Exception {
        LoginRequest req = new LoginRequest("", "");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.email").isNotEmpty())
                .andExpect(jsonPath("$.errors.password").isNotEmpty());
    }

    // 3. Account Creation DTO Validation
    @Test
    void testCreateAccountWithBlankType_ReturnsBadRequest() throws Exception {
        CreateAccountRequest req = new CreateAccountRequest("");

        mockMvc.perform(post("/api/accounts")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.accountType").isNotEmpty());
    }

    @Test
    void testCreateAccountWithInvalidType_ReturnsBadRequest() throws Exception {
        CreateAccountRequest req = new CreateAccountRequest("CREDIT_CARD");

        mockMvc.perform(post("/api/accounts")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.accountType", containsString("SAVINGS or CURRENT")));
    }

    // 4. Fund Transfer DTO Validation
    @Test
    void testTransferWithMissingFieldsAndZeroAmount_ReturnsBadRequest() throws Exception {
        TransferRequest req = new TransferRequest("", "", BigDecimal.ZERO, "");

        mockMvc.perform(post("/api/transactions/transfer")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.senderAccountNumber").isNotEmpty())
                .andExpect(jsonPath("$.errors.receiverAccountNumber").isNotEmpty())
                .andExpect(jsonPath("$.errors.amount", containsString("greater than zero")));
    }

    @Test
    void testTransferWithNegativeAmount_ReturnsBadRequest() throws Exception {
        TransferRequest req = new TransferRequest("123456789012", "987654321098", new BigDecimal("-50.00"), "test");

        mockMvc.perform(post("/api/transactions/transfer")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.amount", containsString("greater than zero")));
    }

    // 5. Beneficiary DTO Validation
    @Test
    void testCreateBeneficiaryWithMissingFields_ReturnsBadRequest() throws Exception {
        CreateBeneficiaryRequest req = new CreateBeneficiaryRequest("", "", "", "");

        mockMvc.perform(post("/api/beneficiaries")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.name").isNotEmpty())
                .andExpect(jsonPath("$.errors.accountNumber").isNotEmpty())
                .andExpect(jsonPath("$.errors.bankName").isNotEmpty())
                .andExpect(jsonPath("$.errors.ifscCode").isNotEmpty());
    }

    // 6. Bill Payment DTO Validation
    @Test
    void testPayBillWithInvalidTypeAndNegativeAmount_ReturnsBadRequest() throws Exception {
        BillPaymentRequest req = new BillPaymentRequest("123456789012", "AIRLINE_TICKET", "Airlines", "B123", new BigDecimal("-10.00"), "");

        mockMvc.perform(post("/api/bills/pay")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.billType", containsString("Supported types")))
                .andExpect(jsonPath("$.errors.amount", containsString("greater than zero")));
    }

    // 7. Loan Application DTO Validation
    @Test
    void testApplyLoanWithInvalidTypeAndNonPositiveValues_ReturnsBadRequest() throws Exception {
        ApplyLoanRequest req = new ApplyLoanRequest("LUXURY_BOAT", BigDecimal.ZERO, -5);

        mockMvc.perform(post("/api/loans/apply")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.loanType", containsString("Supported types")))
                .andExpect(jsonPath("$.errors.amount", containsString("greater than zero")))
                .andExpect(jsonPath("$.errors.tenureMonths", containsString("greater than zero")));
    }

    // 8. Investment Creation DTO Validation
    @Test
    void testCreateInvestmentWithInvalidTypeAndZeroAmount_ReturnsBadRequest() throws Exception {
        CreateInvestmentRequest req = new CreateInvestmentRequest("CRYPTO", BigDecimal.ZERO, 0);

        mockMvc.perform(post("/api/investments")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.investmentType", containsString("Supported types")))
                .andExpect(jsonPath("$.errors.amount", containsString("greater than zero")))
                .andExpect(jsonPath("$.errors.tenureMonths", containsString("greater than zero")));
    }

    // 9. Profile Update DTO Validation
    @Test
    void testUpdateProfileWithInvalidValues_ReturnsBadRequest() throws Exception {
        UpdateProfileRequest req = new UpdateProfileRequest("A", "12345");

        mockMvc.perform(put("/api/users/profile")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errors.name", containsString("at least 2 characters")))
                .andExpect(jsonPath("$.errors.phone", containsString("Invalid phone number")));
    }

    // 10. Global Exception Handling: Not Found (404)
    @Test
    void testGetNonExistentAccount_ReturnsNotFoundResponse() throws Exception {
        mockMvc.perform(get("/api/accounts/99999999")
                        .with(user("admin@bankease.com").roles("ADMIN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message", containsString("not found")))
                .andExpect(jsonPath("$.error", containsString("not found")))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void testGetNonExistentTransaction_ReturnsNotFoundResponse() throws Exception {
        mockMvc.perform(get("/api/transactions/99999999")
                        .with(user("admin@bankease.com").roles("ADMIN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message", containsString("not found")))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    // 11. Global Exception Handling: Forbidden (403)
    @Test
    void testCustomerAccessingAdminRoute_ReturnsForbiddenResponse() throws Exception {
        mockMvc.perform(get("/api/accounts")
                        .with(user(testCustomer.getEmail()).roles("CUSTOMER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message", containsString("Access denied")))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    // 12. Global Exception Handling: Unauthorized (401)
    @Test
    void testLoginWithInvalidCredentials_ReturnsUnauthorizedResponse() throws Exception {
        LoginRequest req = new LoginRequest("unknown@bankease.com", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message", containsString("Invalid credentials")))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void testAccessProtectedEndpointWithoutAuth_ReturnsUnauthorizedResponse() throws Exception {
        mockMvc.perform(get("/api/accounts/my"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }
}
