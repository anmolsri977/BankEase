package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Entity.AuditLog;
import com.NetBanking.BankEase.Repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AuditLogService {

    @Autowired
    AuditLogRepository repo;

    public void addAuditLog(AuditLog auditLog) {
        repo.save(auditLog);
    }

    public List<AuditLog> getAllAuditLogs() {
        return repo.findAll();
    }

    public Optional<AuditLog> getAuditLogById(Long id) {
        return repo.findById(id);
    }

    public String updateAuditLog(AuditLog auditLog) {
        repo.save(auditLog);
        return "Updated audit log successfully";
    }

    public void deleteAuditLog(Long id) {
        repo.deleteById(id);
    }

    public void deleteAllAuditLogs() {
        repo.deleteAll();
    }
}
