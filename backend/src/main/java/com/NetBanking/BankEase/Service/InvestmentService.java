package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Entity.Investment;
import com.NetBanking.BankEase.Repository.InvestmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InvestmentService {

    @Autowired
    InvestmentRepository repo;

    public void addInvestment(Investment investment) {
        repo.save(investment);
    }

    public List<Investment> getAllInvestments() {
        return repo.findAll();
    }

    public Optional<Investment> getInvestmentById(Long id) {
        return repo.findById(id);
    }

    public String updateInvestment(Investment investment) {
        repo.save(investment);
        return "Updated investment successfully";
    }

    public void deleteInvestment(Long id) {
        repo.deleteById(id);
    }

    public void deleteAllInvestments() {
        repo.deleteAll();
    }
}
