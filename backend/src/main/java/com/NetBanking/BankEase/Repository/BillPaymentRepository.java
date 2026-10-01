package com.NetBanking.BankEase.Repository;

import com.NetBanking.BankEase.Entity.Account;
import com.NetBanking.BankEase.Entity.BillPayment;
import com.NetBanking.BankEase.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BillPaymentRepository extends JpaRepository<BillPayment, Long> {

    Optional<BillPayment> findByPaymentId(String paymentId);

    boolean existsByPaymentId(String paymentId);

    List<BillPayment> findByUser(User user);

    List<BillPayment> findByAccount(Account account);

    @Query("SELECT b FROM BillPayment b WHERE (b.user.email = :email OR b.account.user.email = :email) ORDER BY b.createdAt DESC")
    List<BillPayment> findByUserEmail(@Param("email") String email);
}
