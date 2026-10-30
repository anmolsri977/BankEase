package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Dto.UpdateProfileRequest;
import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Exception.ResourceNotFoundException;
import com.NetBanking.BankEase.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService service;

    @PostMapping
    public void saveUser(@RequestBody User user) {
        service.addUser(user);
    }

    @GetMapping({"/profile", "/me"})
    public ResponseEntity<User> getMyProfile(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        String email = authentication.getName();
        User user = service.getUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PutMapping({"/profile", "/me"})
    public ResponseEntity<User> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Unauthorized");
        }
        User updated = service.updateProfile(request, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public List<User> fetchUsers() {
        return service.getAllUsers();
    }

    @GetMapping("/{id}")
    public Optional<User> fetchUser(@PathVariable Long id) {
        return service.getUserById(id);
    }

    @PutMapping
    public void modifyUser(@RequestBody User user) {
        service.updateUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteAUser(@PathVariable Long id) {
        service.deleteUser(id);
    }

    @DeleteMapping
    public void deleteUsers() {
        service.deleteAllUsers();
    }
}
