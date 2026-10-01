package com.NetBanking.BankEase.Repository;

import com.NetBanking.BankEase.Entity.Investment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestmentRepository extends JpaRepository<Investment, Long> {
}
