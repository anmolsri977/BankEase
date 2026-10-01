package com.NetBanking.BankEase;

import com.NetBanking.BankEase.Dto.BillPaymentRequest;
import com.NetBanking.BankEase.Entity.Account;
import com.NetBanking.BankEase.Entity.BillPayment;
import com.NetBanking.BankEase.Entity.Role;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.AccountRepository;
import com.NetBanking.BankEase.Repository.BillPaymentRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import com.NetBanking.BankEase.Service.BillPaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class BillPaymentTests {

    @Autowired
    private BillPaymentService billPaymentService;

    @Autowired
    private BillPaymentRepository billPaymentRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    private User userA;
    private User userB;
    private Account accountA;
    private Account accountB;

    @BeforeEach
    void setUp() {
        userA = userRepository.findByEmail("bill_user_a@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Bill User A");
            u.setEmail("bill_user_a@bankease.com");
            u.setPassword("hashed");
            u.setPhone("1111111111");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        userB = userRepository.findByEmail("bill_user_b@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Bill User B");
            u.setEmail("bill_user_b@bankease.com");
            u.setPassword("hashed");
            u.setPhone("2222222222");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        accountA = accountRepository.findByAccountNumber("888811112222").orElseGet(() -> {
            Account acc = new Account();
            acc.setAccountNumber("888811112222");
            acc.setAccountType("SAVINGS");
            acc.setBalance(new BigDecimal("1000.00"));
            acc.setStatus("ACTIVE");
            acc.setCreatedAt(LocalDateTime.now());
            acc.setUser(userA);
            return accountRepository.save(acc);
        });
        accountA.setBalance(new BigDecimal("1000.00"));
        accountA.setStatus("ACTIVE");
        accountA = accountRepository.save(accountA);

        accountB = accountRepository.findByAccountNumber("888833334444").orElseGet(() -> {
            Account acc = new Account();
            acc.setAccountNumber("888833334444");
            acc.setAccountType("CURRENT");
            acc.setBalance(new BigDecimal("500.00"));
            acc.setStatus("ACTIVE");
            acc.setCreatedAt(LocalDateTime.now());
            acc.setUser(userB);
            return accountRepository.save(acc);
        });
        accountB.setBalance(new BigDecimal("500.00"));
        accountB.setStatus("ACTIVE");
        accountB = accountRepository.save(accountB);
    }

    @Test
    void testSuccessfulElectricityBillPayment() {
        BillPaymentRequest req = new BillPaymentRequest(
                "888811112222",
                "ELECTRICITY",
                "State Power Corp",
                "ELEC-98765",
                new BigDecimal("150.00"),
                "Monthly electricity bill"
        );

        BillPayment payment = billPaymentService.payBill(req, "bill_user_a@bankease.com");

        assertNotNull(payment.getPaymentId());
        assertEquals("ELECTRICITY", payment.getBillType());
        assertEquals("State Power Corp", payment.getBillerName());
        assertEquals("ELEC-98765", payment.getBillNumber());
        assertEquals(new BigDecimal("150.00"), payment.getAmount());
        assertEquals("SUCCESS", payment.getStatus());
        assertNotNull(payment.getCreatedAt());

        Account updatedA = accountRepository.findByAccountNumber("888811112222").orElseThrow();
        assertEquals(0, new BigDecimal("850.00").compareTo(updatedA.getBalance()));
    }

    @Test
    void testSuccessfulMobileBillPayment() {
        BillPaymentRequest req = new BillPaymentRequest(
                "888811112222",
                "MOBILE",
                "Airtel Telecom",
                "MOB-55443",
                new BigDecimal("50.00"),
                "Mobile recharge"
        );

        BillPayment payment = billPaymentService.payBill(req, "bill_user_a@bankease.com");

        assertNotNull(payment.getPaymentId());
        assertEquals("MOBILE", payment.getBillType());
        assertEquals("SUCCESS", payment.getStatus());

        Account updatedA = accountRepository.findByAccountNumber("888811112222").orElseThrow();
        assertEquals(0, new BigDecimal("950.00").compareTo(updatedA.getBalance()));
    }

    @Test
    void testInsufficientBalance() {
        BillPaymentRequest req = new BillPaymentRequest(
                "888811112222",
                "INTERNET",
                "SpeedNet Broadband",
                "NET-11223",
                new BigDecimal("5000.00"),
                "High speed internet"
        );

        assertThrows(IllegalArgumentException.class, () -> billPaymentService.payBill(req, "bill_user_a@bankease.com"));

        Account updatedA = accountRepository.findByAccountNumber("888811112222").orElseThrow();
        assertEquals(0, new BigDecimal("1000.00").compareTo(updatedA.getBalance()));
    }

    @Test
    void testAmountZeroOrNegative() {
        BillPaymentRequest reqZero = new BillPaymentRequest("888811112222", "WATER", "City Water", "WTR-1", BigDecimal.ZERO, "Zero");
        assertThrows(IllegalArgumentException.class, () -> billPaymentService.payBill(reqZero, "bill_user_a@bankease.com"));

        BillPaymentRequest reqNeg = new BillPaymentRequest("888811112222", "WATER", "City Water", "WTR-2", new BigDecimal("-25.00"), "Neg");
        assertThrows(IllegalArgumentException.class, () -> billPaymentService.payBill(reqNeg, "bill_user_a@bankease.com"));
    }

    @Test
    void testInvalidBillType() {
        BillPaymentRequest req = new BillPaymentRequest("888811112222", "GROCERY", "Supermarket", "BILL-99", new BigDecimal("100.00"), "Invalid type");
        assertThrows(IllegalArgumentException.class, () -> billPaymentService.payBill(req, "bill_user_a@bankease.com"));
    }

    @Test
    void testNonExistentAccount() {
        BillPaymentRequest req = new BillPaymentRequest("999999999999", "ELECTRICITY", "Power Co", "E-1", new BigDecimal("100.00"), "Fake acc");
        assertThrows(IllegalArgumentException.class, () -> billPaymentService.payBill(req, "bill_user_a@bankease.com"));
    }

    @Test
    void testAccountBelongingToAnotherCustomer() {
        // User B tries to pay using User A's account
        BillPaymentRequest req = new BillPaymentRequest("888811112222", "WATER", "Water Board", "W-1", new BigDecimal("100.00"), "Unauthorized");
        assertThrows(AccessDeniedException.class, () -> billPaymentService.payBill(req, "bill_user_b@bankease.com"));
    }

    @Test
    void testBlockedAccount() {
        accountA.setStatus("BLOCKED");
        accountRepository.save(accountA);

        BillPaymentRequest req = new BillPaymentRequest("888811112222", "ELECTRICITY", "Power Co", "E-1", new BigDecimal("100.00"), "Blocked");
        assertThrows(IllegalStateException.class, () -> billPaymentService.payBill(req, "bill_user_a@bankease.com"));
    }

    @Test
    void testCustomerBillHistory() {
        BillPaymentRequest req = new BillPaymentRequest("888811112222", "WATER", "City Water Board", "WTR-7788", new BigDecimal("80.00"), "Water bill");
        billPaymentService.payBill(req, "bill_user_a@bankease.com");

        List<BillPayment> history = billPaymentService.getMyBillPayments("bill_user_a@bankease.com");
        assertFalse(history.isEmpty());
        assertTrue(history.stream().anyMatch(b -> b.getBillNumber().equals("WTR-7788")));
    }

    @Test
    void testCustomerCannotViewAnotherCustomerBill() {
        BillPaymentRequest req = new BillPaymentRequest("888811112222", "INTERNET", "Fiber Net", "NET-9999", new BigDecimal("99.00"), "Fiber");
        BillPayment payment = billPaymentService.payBill(req, "bill_user_a@bankease.com");

        // User B tries to view User A's bill
        assertThrows(AccessDeniedException.class, () -> billPaymentService.getBillPaymentById(payment.getId(), "bill_user_b@bankease.com", false));

        // Admin can view User A's bill
        BillPayment adminView = billPaymentService.getBillPaymentById(payment.getId(), "admin@bankease.com", true);
        assertNotNull(adminView);
        assertEquals(payment.getId(), adminView.getId());
    }

    @Test
    void testAdminCanViewAllBills() {
        BillPaymentRequest req = new BillPaymentRequest("888811112222", "WATER", "Aqua Board", "AQ-1234", new BigDecimal("45.00"), "Aqua");
        billPaymentService.payBill(req, "bill_user_a@bankease.com");

        List<BillPayment> allBills = billPaymentService.getAllBillPayments();
        assertFalse(allBills.isEmpty());
    }
}
