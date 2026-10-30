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
public class UpdateLoanStatusRequest {
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "(?i)^(PENDING|APPROVED|REJECTED|ACTIVE|CLOSED)$", message = "Invalid loan status.")
    private String status;

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    private String remarks;
}
