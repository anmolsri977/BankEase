package com.NetBanking.BankEase.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateBeneficiaryRequest {
    private String name;
    private String accountNumber;
    private String bankName;
    private String ifscCode;
}
