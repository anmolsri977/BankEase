package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Entity.AuditLog;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.AuditLogRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository repo;

    @Autowired
    private UserRepository userRepository;

    public AuditLog logAction(User user, String action, String description) {
        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setAction(action);
        log.setDescription(description);
        log.setTimestamp(LocalDateTime.now());
        return repo.save(log);
    }

    public AuditLog logAction(String userEmail, String action, String description) {
        User user = null;
        if (userEmail != null && !userEmail.trim().isEmpty()) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }
        return logAction(user, action, description);
    }

    public List<AuditLog> getMyAuditLogs(String userEmail) {
        return repo.findByUserEmailOrderByTimestampDesc(userEmail);
    }

    public List<AuditLog> getAllAuditLogs() {
        return repo.findAllByOrderByTimestampDesc();
    }
}
