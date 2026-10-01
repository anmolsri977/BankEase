package com.NetBanking.BankEase.Repository;

import com.NetBanking.BankEase.Entity.Loan;
import com.NetBanking.BankEase.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUser(User user);
    List<Loan> findByUserEmail(String email);
    Optional<Loan> findByLoanId(String loanId);
    boolean existsByLoanId(String loanId);
}
