package com.NetBanking.BankEase.Security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/audit-logs/my", "/api/auditlogs/my").hasRole("CUSTOMER")
                        .requestMatchers("/api/audit-logs/**", "/api/auditlogs/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/accounts/my").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/accounts").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/accounts").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/accounts/{id}").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/accounts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/accounts/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/transactions/transfer").hasRole("CUSTOMER")
                        .requestMatchers("/api/transactions/my").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/transactions").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/transactions/{id}").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/transactions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/transactions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/transactions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/beneficiaries").hasRole("ADMIN")
                        .requestMatchers("/api/beneficiaries/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/bills/pay", "/api/bill-payments/pay", "/api/billpayments/pay").hasRole("CUSTOMER")
                        .requestMatchers("/api/bills/my", "/api/bill-payments/my", "/api/billpayments/my").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/bills", "/api/bill-payments", "/api/billpayments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/bills/{id}", "/api/bill-payments/{id}", "/api/billpayments/{id}").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/bills/**", "/api/bill-payments/**", "/api/billpayments/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/bills/**", "/api/bill-payments/**", "/api/billpayments/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/bills/**", "/api/bill-payments/**", "/api/billpayments/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/loans/apply").hasRole("CUSTOMER")
                        .requestMatchers("/api/loans/my").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/loans").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/loans/{id}/status", "/api/loans/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/loans/{id}", "/api/loans/*").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/loans/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/loans/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/loans/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/investments").hasRole("CUSTOMER")
                        .requestMatchers("/api/investments/my").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/investments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/investments/{id}/status", "/api/investments/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/investments/{id}", "/api/investments/*").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/investments/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/investments/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/investments/**").hasRole("ADMIN")
                        .requestMatchers("/api/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied\"}");
                        })
                );

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
