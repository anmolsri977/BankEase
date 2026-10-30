package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.BillPaymentRequest;
import com.NetBanking.BankEase.Entity.BillPayment;
import com.NetBanking.BankEase.Service.BillPaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/bills", "/api/bill-payments", "/api/billpayments"})
public class BillPaymentController {

    @Autowired
    private BillPaymentService service;

    @PostMapping("/pay")
    public ResponseEntity<BillPayment> payBill(@Valid @RequestBody BillPaymentRequest request, Authentication authentication) {
        BillPayment payment = service.payBill(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
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
    public ResponseEntity<BillPayment> getBillById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        BillPayment bill = service.getBillPaymentById(id, authentication.getName(), isAdmin);
        return ResponseEntity.ok(bill);
    }
}
