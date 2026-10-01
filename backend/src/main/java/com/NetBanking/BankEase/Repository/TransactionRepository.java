package com.NetBanking.BankEase.Repository;

import com.NetBanking.BankEase.Entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionId(String transactionId);

    boolean existsByTransactionId(String transactionId);

    @Query("SELECT t FROM Transaction t WHERE (t.senderAccount.user.email = :email OR t.receiverAccount.user.email = :email) ORDER BY t.createdAt DESC")
    List<Transaction> findByUserEmail(@Param("email") String email);
}
