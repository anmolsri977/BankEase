package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Entity.Investment;
import com.NetBanking.BankEase.Service.InvestmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    @Autowired
    InvestmentService service;

    @PostMapping
    public void saveInvestment(@RequestBody Investment investment) {
        service.addInvestment(investment);
    }

    @GetMapping
    public List<Investment> fetchInvestments() {
        return service.getAllInvestments();
    }

    @GetMapping("/{id}")
    public Optional<Investment> fetchInvestment(@PathVariable Long id) {
        return service.getInvestmentById(id);
    }

    @PutMapping
    public void modifyInvestment(@RequestBody Investment investment) {
        service.updateInvestment(investment);
    }

    @DeleteMapping("/{id}")
    public void deleteAnInvestment(@PathVariable Long id) {
        service.deleteInvestment(id);
    }

    @DeleteMapping
    public void deleteInvestments() {
        service.deleteAllInvestments();
    }
}
