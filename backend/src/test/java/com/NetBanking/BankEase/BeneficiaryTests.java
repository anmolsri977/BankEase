package com.NetBanking.BankEase;

import com.NetBanking.BankEase.Dto.CreateBeneficiaryRequest;
import com.NetBanking.BankEase.Entity.Beneficiary;
import com.NetBanking.BankEase.Entity.Role;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.BeneficiaryRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import com.NetBanking.BankEase.Service.BeneficiaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class BeneficiaryTests {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private UserRepository userRepository;

    private User customerJohn;
    private User customerJane;

    @BeforeEach
    void setUp() {
        customerJohn = userRepository.findByEmail("john_ben_test@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("John Ben");
            u.setEmail("john_ben_test@bankease.com");
            u.setPassword("hashed");
            u.setPhone("1234567890");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        customerJane = userRepository.findByEmail("jane_ben_test@bankease.com").orElseGet(() -> {
            User u = new User();
            u.setName("Jane Ben");
            u.setEmail("jane_ben_test@bankease.com");
            u.setPassword("hashed");
            u.setPhone("9876543210");
            u.setRole(Role.CUSTOMER);
            u.setCreatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });
    }

    @Test
    void testCreateBeneficiary() {
        CreateBeneficiaryRequest request = new CreateBeneficiaryRequest("Alice Smith", "123456789012", "HDFC Bank", "HDFC0001234");
        Beneficiary b = beneficiaryService.createBeneficiary(request, "john_ben_test@bankease.com");

        assertNotNull(b.getId());
        assertEquals("Alice Smith", b.getName());
        assertEquals("123456789012", b.getAccountNumber());
        assertEquals("HDFC Bank", b.getBankName());
        assertEquals("HDFC0001234", b.getIfscCode());
        assertEquals("john_ben_test@bankease.com", b.getUser().getEmail());
    }

    @Test
    void testGetOwnBeneficiaries() {
        CreateBeneficiaryRequest request = new CreateBeneficiaryRequest("Bob Johnson", "987654321098", "ICICI Bank", "ICIC0005678");
        beneficiaryService.createBeneficiary(request, "john_ben_test@bankease.com");

        List<Beneficiary> myBeneficiaries = beneficiaryService.getMyBeneficiaries("john_ben_test@bankease.com");
        assertFalse(myBeneficiaries.isEmpty());
        assertTrue(myBeneficiaries.stream().anyMatch(b -> b.getName().equals("Bob Johnson")));
    }

    @Test
    void testGetOwnBeneficiaryById() {
        CreateBeneficiaryRequest request = new CreateBeneficiaryRequest("Charlie Brown", "112233445566", "SBI", "SBIN0009999");
        Beneficiary created = beneficiaryService.createBeneficiary(request, "john_ben_test@bankease.com");

        Beneficiary fetched = beneficiaryService.getBeneficiaryById(created.getId(), "john_ben_test@bankease.com", false);
        assertNotNull(fetched);
        assertEquals(created.getId(), fetched.getId());
        assertEquals("Charlie Brown", fetched.getName());
    }

    @Test
    void testUpdateOwnBeneficiary() {
        CreateBeneficiaryRequest request = new CreateBeneficiaryRequest("David Miller", "445566778899", "Axis Bank", "UTIB0001111");
        Beneficiary created = beneficiaryService.createBeneficiary(request, "john_ben_test@bankease.com");

        CreateBeneficiaryRequest updateRequest = new CreateBeneficiaryRequest("David Miller Updated", "445566778899", "Axis Bank", "UTIB0001111");
        Beneficiary updated = beneficiaryService.updateBeneficiary(created.getId(), updateRequest, "john_ben_test@bankease.com", false);

        assertEquals("David Miller Updated", updated.getName());
    }

    @Test
    void testDeleteOwnBeneficiary() {
        CreateBeneficiaryRequest request = new CreateBeneficiaryRequest("Evan Wright", "778899001122", "Kotak Bank", "KKBK0002222");
        Beneficiary created = beneficiaryService.createBeneficiary(request, "john_ben_test@bankease.com");

        beneficiaryService.deleteBeneficiary(created.getId(), "john_ben_test@bankease.com", false);
        assertFalse(beneficiaryRepository.existsById(created.getId()));
    }

    @Test
    void testCustomerACannotAccessCustomerBBeneficiary() {
        CreateBeneficiaryRequest request = new CreateBeneficiaryRequest("John Secret Beneficiary", "556677889900", "Yes Bank", "YESB0003333");
        Beneficiary johnBen = beneficiaryService.createBeneficiary(request, "john_ben_test@bankease.com");

        // Jane tries to access John's beneficiary -> AccessDeniedException (403)
        assertThrows(AccessDeniedException.class, () ->
                beneficiaryService.getBeneficiaryById(johnBen.getId(), "jane_ben_test@bankease.com", false)
        );
    }

    @Test
    void testCustomerACannotUpdateCustomerBBeneficiary() {
        CreateBeneficiaryRequest request = new CreateBeneficiaryRequest("John Beneficiary To Keep", "667788990011", "Punjab National Bank", "PUNB0004444");
        Beneficiary johnBen = beneficiaryService.createBeneficiary(request, "john_ben_test@bankease.com");

        CreateBeneficiaryRequest fraudUpdate = new CreateBeneficiaryRequest("Hacked Name", "667788990011", "Punjab National Bank", "PUNB0004444");
        assertThrows(AccessDeniedException.class, () ->
                beneficiaryService.updateBeneficiary(johnBen.getId(), fraudUpdate, "jane_ben_test@bankease.com", false)
        );
    }

    @Test
    void testCustomerACannotDeleteCustomerBBeneficiary() {
        CreateBeneficiaryRequest request = new CreateBeneficiaryRequest("John Beneficiary Safe", "889900112233", "Bank of Baroda", "BARB0005555");
        Beneficiary johnBen = beneficiaryService.createBeneficiary(request, "john_ben_test@bankease.com");

        assertThrows(AccessDeniedException.class, () ->
                beneficiaryService.deleteBeneficiary(johnBen.getId(), "jane_ben_test@bankease.com", false)
        );
        assertTrue(beneficiaryRepository.existsById(johnBen.getId()));
    }

    @Test
    void testInvalidBlankBeneficiaryData() {
        CreateBeneficiaryRequest blankName = new CreateBeneficiaryRequest("", "123456789012", "HDFC", "HDFC0001234");
        assertThrows(IllegalArgumentException.class, () -> beneficiaryService.createBeneficiary(blankName, "john_ben_test@bankease.com"));

        CreateBeneficiaryRequest blankAcc = new CreateBeneficiaryRequest("Alice", "  ", "HDFC", "HDFC0001234");
        assertThrows(IllegalArgumentException.class, () -> beneficiaryService.createBeneficiary(blankAcc, "john_ben_test@bankease.com"));

        CreateBeneficiaryRequest blankBank = new CreateBeneficiaryRequest("Alice", "123456789012", "", "HDFC0001234");
        assertThrows(IllegalArgumentException.class, () -> beneficiaryService.createBeneficiary(blankBank, "john_ben_test@bankease.com"));

        CreateBeneficiaryRequest blankIfsc = new CreateBeneficiaryRequest("Alice", "123456789012", "HDFC", " ");
        assertThrows(IllegalArgumentException.class, () -> beneficiaryService.createBeneficiary(blankIfsc, "john_ben_test@bankease.com"));
    }
}
