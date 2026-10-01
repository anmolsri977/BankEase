package com.NetBanking.BankEase.Repository;

import com.NetBanking.BankEase.Entity.Beneficiary;
import com.NetBanking.BankEase.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {
    List<Beneficiary> findByUser(User user);
    List<Beneficiary> findByUserEmail(String email);
    boolean existsByIdAndUser(Long id, User user);
    boolean existsByIdAndUserEmail(Long id, String email);
}
