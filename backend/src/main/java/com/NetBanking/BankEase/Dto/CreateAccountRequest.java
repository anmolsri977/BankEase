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
public class CreateAccountRequest {
    @NotBlank(message = "Account type is required")
    @Pattern(regexp = "(?i)^(SAVINGS|CURRENT)$", message = "Invalid account type. Must be SAVINGS or CURRENT.")
    private String accountType;
}
