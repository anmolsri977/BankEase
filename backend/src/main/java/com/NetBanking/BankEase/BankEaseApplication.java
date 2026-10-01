package com.NetBanking.BankEase;

import com.NetBanking.BankEase.Entity.Role;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.AccountRepository;
import com.NetBanking.BankEase.Repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@SpringBootApplication
public class BankEaseApplication {

	public static void main(String[] args) {
		SpringApplication.run(BankEaseApplication.class, args);
	}

	@Bean
	public CommandLineRunner initAdmin(UserRepository userRepository, AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			if (!userRepository.existsByEmail("admin@bankease.com")) {
				User admin = new User();
				admin.setName("System Admin");
				admin.setEmail("admin@bankease.com");
				admin.setPassword(passwordEncoder.encode("Admin123!"));
				admin.setPhone("1234567890");
				admin.setRole(Role.ADMIN);
				admin.setKycStatus("VERIFIED");
				admin.setCreatedAt(LocalDateTime.now());
				userRepository.save(admin);
			}

			userRepository.findByEmail("john.doe@example.com").ifPresent(john -> {
				accountRepository.findByUser(john).forEach(account -> {
					if (account.getBalance() == null || account.getBalance().compareTo(new BigDecimal("5000.00")) < 0) {
						account.setBalance(new BigDecimal("5000.00"));
						accountRepository.save(account);
					}
				});
			});
		};
	}

}
