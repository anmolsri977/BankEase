package com.NetBanking.BankEase.Dto;

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
public class UpdateProfileRequest {
    @Size(min = 2, max = 100, message = "Name must have at least 2 characters")
    private String name;

    @Pattern(regexp = "^$|^[6-9]\\d{9}$", message = "Invalid phone number. Must be 10 digits starting with 6, 7, 8, or 9.")
    private String phone;
}
