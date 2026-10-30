package com.NetBanking.BankEase.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInvestmentStatusRequest {
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "(?i)^(ACTIVE|MATURED|CLOSED)$", message = "Invalid investment status. Supported statuses: ACTIVE, MATURED, CLOSED")
    private String status;
}
