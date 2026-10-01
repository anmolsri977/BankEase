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
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String loanId;

    private String loanType;

    private BigDecimal amount;

    private Double interestRate;

    private Integer tenureMonths;

    private String status;

    private LocalDateTime applicationDate;

    private String remarks;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
