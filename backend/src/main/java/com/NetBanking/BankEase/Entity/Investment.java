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

    private String investmentType;

    private BigDecimal amount;

    private Double interestRate;

    private String status;

    private LocalDateTime startDate;

    private LocalDateTime maturityDate;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
