package com.NetBanking.BankEase.Repository;

import com.NetBanking.BankEase.Entity.Investment;
import com.NetBanking.BankEase.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    List<Investment> findByUser(User user);
    List<Investment> findByUserEmail(String email);
    Optional<Investment> findByInvestmentId(String investmentId);
    boolean existsByInvestmentId(String investmentId);
}
