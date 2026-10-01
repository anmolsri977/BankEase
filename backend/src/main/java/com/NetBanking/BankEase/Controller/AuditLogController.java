package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Entity.AuditLog;
import com.NetBanking.BankEase.Service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/audit-logs", "/api/auditlogs"})
public class AuditLogController {

    @Autowired
    private AuditLogService service;

    @GetMapping("/my")
    public ResponseEntity<List<AuditLog>> getMyAuditLogs(Authentication authentication) {
        List<AuditLog> logs = service.getMyAuditLogs(authentication.getName());
        return ResponseEntity.ok(logs);
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(service.getAllAuditLogs());
    }
}
