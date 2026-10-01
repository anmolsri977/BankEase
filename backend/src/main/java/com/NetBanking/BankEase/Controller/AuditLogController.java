package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Entity.AuditLog;
import com.NetBanking.BankEase.Service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping({"/api/audit-logs", "/api/auditlogs"})
public class AuditLogController {

    @Autowired
    AuditLogService service;

    @PostMapping
    public void saveAuditLog(@RequestBody AuditLog auditLog) {
        service.addAuditLog(auditLog);
    }

    @GetMapping
    public List<AuditLog> fetchAuditLogs() {
        return service.getAllAuditLogs();
    }

    @GetMapping("/{id}")
    public Optional<AuditLog> fetchAuditLog(@PathVariable Long id) {
        return service.getAuditLogById(id);
    }

    @PutMapping
    public void modifyAuditLog(@RequestBody AuditLog auditLog) {
        service.updateAuditLog(auditLog);
    }

    @DeleteMapping("/{id}")
    public void deleteAnAuditLog(@PathVariable Long id) {
        service.deleteAuditLog(id);
    }

    @DeleteMapping
    public void deleteAuditLogs() {
        service.deleteAllAuditLogs();
    }
}
