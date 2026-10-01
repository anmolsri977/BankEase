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
public class BillPaymentRequest {
    private String accountNumber;
    private String billType;
    private String billerName;
    private String billNumber;
    private BigDecimal amount;
    private String description;
}
