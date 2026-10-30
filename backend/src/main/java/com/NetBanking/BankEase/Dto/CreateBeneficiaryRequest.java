package com.NetBanking.BankEase.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateBeneficiaryRequest {
    @NotBlank(message = "Beneficiary name is required")
    @Size(min = 2, max = 100, message = "Beneficiary name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Beneficiary account number is required")
    @Size(min = 5, max = 30, message = "Account number must be between 5 and 30 characters")
    private String accountNumber;

    @NotBlank(message = "Bank name is required")
    @Size(min = 2, max = 100, message = "Bank name must be between 2 and 100 characters")
    private String bankName;

    @NotBlank(message = "IFSC code is required")
    @Pattern(regexp = "^[A-Za-z0-9]{4,15}$", message = "IFSC code must be alphanumeric and between 4 and 15 characters")
    private String ifscCode;
}
