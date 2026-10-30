package com.NetBanking.BankEase.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BillPaymentRequest {
    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotBlank(message = "Bill type is required")
    @Pattern(regexp = "(?i)^(ELECTRICITY|WATER|MOBILE|INTERNET)$", message = "Invalid bill type. Supported types: ELECTRICITY, WATER, MOBILE, INTERNET.")
    private String billType;

    @NotBlank(message = "Biller name is required")
    @Size(max = 100, message = "Biller name cannot exceed 100 characters")
    private String billerName;

    @NotBlank(message = "Bill number is required")
    @Size(max = 50, message = "Bill number cannot exceed 50 characters")
    private String billNumber;

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
    private BigDecimal amount;

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;
}
