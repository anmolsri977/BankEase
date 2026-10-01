package com.NetBanking.BankEase.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplyLoanRequest {
    private String loanType;
    private BigDecimal amount;
    private Integer tenureMonths;
}
