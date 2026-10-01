package com.NetBanking.BankEase.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String investmentId;

    private String investmentType;

    private BigDecimal amount;

    private String status;

    private LocalDateTime investmentDate;

    private LocalDateTime maturityDate;

    private BigDecimal returns;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
