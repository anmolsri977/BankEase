package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.BillPaymentRequest;
import com.NetBanking.BankEase.Entity.BillPayment;
import com.NetBanking.BankEase.Service.BillPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/bills", "/api/bill-payments", "/api/billpayments"})
public class BillPaymentController {

    @Autowired
    private BillPaymentService service;

    @PostMapping("/pay")
    public ResponseEntity<?> payBill(@RequestBody BillPaymentRequest request, Authentication authentication) {
        try {
            BillPayment payment = service.payBill(request, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<BillPayment>> getMyBills(Authentication authentication) {
        List<BillPayment> bills = service.getMyBillPayments(authentication.getName());
        return ResponseEntity.ok(bills);
    }

    @GetMapping
    public ResponseEntity<List<BillPayment>> getAllBills() {
        return ResponseEntity.ok(service.getAllBillPayments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBillById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            BillPayment bill = service.getBillPaymentById(id, authentication.getName(), isAdmin);
            return ResponseEntity.ok(bill);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
