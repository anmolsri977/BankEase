package com.NetBanking.BankEase.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
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
    @NotBlank(message = "Loan type is required")
    @Pattern(regexp = "(?i)^(PERSONAL|HOME|EDUCATION|VEHICLE)$", message = "Invalid loan type. Supported types: PERSONAL, HOME, EDUCATION, VEHICLE")
    private String loanType;

    @NotNull(message = "Loan amount is required")
    @DecimalMin(value = "0.01", message = "Loan amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Tenure months is required")
    @Positive(message = "Tenure months must be greater than zero")
    private Integer tenureMonths;
}
