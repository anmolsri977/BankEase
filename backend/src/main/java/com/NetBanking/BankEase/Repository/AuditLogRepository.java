package com.NetBanking.BankEase.Repository;

import com.NetBanking.BankEase.Entity.AuditLog;
import com.NetBanking.BankEase.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUser(User user);
    List<AuditLog> findByUserOrderByTimestampDesc(User user);
    List<AuditLog> findByUserEmail(String email);
    List<AuditLog> findByUserEmailOrderByTimestampDesc(String email);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
