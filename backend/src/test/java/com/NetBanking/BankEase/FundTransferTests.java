package com.NetBanking.BankEase;

import com.NetBanking.BankEase.Dto.TransferRequest;
import com.NetBanking.BankEase.Entity.Account;
import com.NetBanking.BankEase.Entity.Role;
import com.NetBanking.BankEase.Entity.Transaction;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.AccountRepository;
import com.NetBanking.BankEase.Repository.TransactionRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import com.NetBanking.BankEase.Service.TransactionService;
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
public class FundTransferTests {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private User userA;
    private User userB;
    private Account accountA;
    private Account accountB;

    @BeforeEach
    void setUp() {
        userA = userRepository.findByEmail("testA@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("User A");
            u.setEmail("testA@bankease.com");
            u.setPassword("hashed");
            u.setPhone("1111111111");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        userB = userRepository.findByEmail("testB@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("User B");
            u.setEmail("testB@bankease.com");
            u.setPassword("hashed");
            u.setPhone("2222222222");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        accountA = accountRepository.findByAccountNumber("111111111111").orElseGet(() -> {
            Account acc = new Account();
            acc.setAccountNumber("111111111111");
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

        accountB = accountRepository.findByAccountNumber("222222222222").orElseGet(() -> {
            Account acc = new Account();
            acc.setAccountNumber("222222222222");
            acc.setAccountType("SAVINGS");
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
    void testSuccessfulTransfer() {
        TransferRequest request = new TransferRequest("111111111111", "222222222222", new BigDecimal("200.00"), "Test transfer");
        Transaction txn = transactionService.transferFunds(request, "testA@bankease.com");

        assertNotNull(txn.getTransactionId());
        assertEquals("TRANSFER", txn.getTransactionType());
        assertEquals("SUCCESS", txn.getStatus());
        assertEquals(new BigDecimal("200.00"), txn.getAmount());

        Account updatedA = accountRepository.findByAccountNumber("111111111111").orElseThrow();
        Account updatedB = accountRepository.findByAccountNumber("222222222222").orElseThrow();
        assertEquals(0, new BigDecimal("800.00").compareTo(updatedA.getBalance()));
        assertEquals(0, new BigDecimal("700.00").compareTo(updatedB.getBalance()));
    }

    @Test
    void testInsufficientBalance() {
        TransferRequest request = new TransferRequest("111111111111", "222222222222", new BigDecimal("2000.00"), "Too much");
        assertThrows(IllegalArgumentException.class, () -> transactionService.transferFunds(request, "testA@bankease.com"));

        Account updatedA = accountRepository.findByAccountNumber("111111111111").orElseThrow();
        assertEquals(0, new BigDecimal("1000.00").compareTo(updatedA.getBalance()));
    }

    @Test
    void testAmountZeroOrNegative() {
        TransferRequest reqZero = new TransferRequest("111111111111", "222222222222", BigDecimal.ZERO, "Zero amount");
        assertThrows(IllegalArgumentException.class, () -> transactionService.transferFunds(reqZero, "testA@bankease.com"));

        TransferRequest reqNeg = new TransferRequest("111111111111", "222222222222", new BigDecimal("-50.00"), "Neg amount");
        assertThrows(IllegalArgumentException.class, () -> transactionService.transferFunds(reqNeg, "testA@bankease.com"));
    }

    @Test
    void testSameSenderAndReceiver() {
        TransferRequest request = new TransferRequest("111111111111", "111111111111", new BigDecimal("100.00"), "Self");
        assertThrows(IllegalArgumentException.class, () -> transactionService.transferFunds(request, "testA@bankease.com"));
    }

    @Test
    void testNonExistentAccount() {
        TransferRequest request = new TransferRequest("111111111111", "999999999999", new BigDecimal("100.00"), "Fake receiver");
        assertThrows(IllegalArgumentException.class, () -> transactionService.transferFunds(request, "testA@bankease.com"));
    }

    @Test
    void testSenderBelongingToAnotherCustomer() {
        TransferRequest request = new TransferRequest("111111111111", "222222222222", new BigDecimal("100.00"), "Fraud attempt");
        assertThrows(AccessDeniedException.class, () -> transactionService.transferFunds(request, "testB@bankease.com"));
    }

    @Test
    void testBlockedSender() {
        accountA.setStatus("BLOCKED");
        accountRepository.save(accountA);

        TransferRequest request = new TransferRequest("111111111111", "222222222222", new BigDecimal("100.00"), "Blocked sender");
        assertThrows(IllegalStateException.class, () -> transactionService.transferFunds(request, "testA@bankease.com"));
    }

    @Test
    void testBlockedReceiver() {
        accountB.setStatus("BLOCKED");
        accountRepository.save(accountB);

        TransferRequest request = new TransferRequest("111111111111", "222222222222", new BigDecimal("100.00"), "Blocked receiver");
        assertThrows(IllegalStateException.class, () -> transactionService.transferFunds(request, "testA@bankease.com"));
    }

    @Test
    void testCustomerTransactionHistory() {
        TransferRequest request = new TransferRequest("111111111111", "222222222222", new BigDecimal("100.00"), "History test");
        transactionService.transferFunds(request, "testA@bankease.com");

        List<Transaction> txnsA = transactionService.getMyTransactions("testA@bankease.com");
        List<Transaction> txnsB = transactionService.getMyTransactions("testB@bankease.com");

        assertFalse(txnsA.isEmpty());
        assertFalse(txnsB.isEmpty());
    }
}
