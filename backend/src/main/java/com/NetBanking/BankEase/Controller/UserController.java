package com.NetBanking.BankEase.Controller;

import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    UserService service;

    @PostMapping
    public void saveUser(@RequestBody User user){
        service.addUser(user);
    }

    @GetMapping({"/profile", "/me"})
    public org.springframework.http.ResponseEntity<?> getMyProfile(org.springframework.security.core.Authentication authentication) {
        if (authentication == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String email = authentication.getName();
        Optional<User> userOpt = service.getUserByEmail(email);
        if (userOpt.isEmpty()) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("error", "User not found"));
        }
        return org.springframework.http.ResponseEntity.ok(userOpt.get());
    }

    @PutMapping({"/profile", "/me"})
    public org.springframework.http.ResponseEntity<?> updateProfile(
            @RequestBody com.NetBanking.BankEase.Dto.UpdateProfileRequest request,
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null) {
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        try {
            User updated = service.updateProfile(request, authentication.getName());
            return org.springframework.http.ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return org.springframework.http.ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<User> fetchUsers(){
        return service.getAllUsers();
    }

    @GetMapping("/{id}")
    public Optional<User> fetchUser(@PathVariable Long id){
         return service.getUserById(id);
    }

    @PutMapping
    public void modifyUser(@RequestBody User user){
        service.updateUser(user);
    }


    @DeleteMapping("/{id}")
    public void deleteAUser(@PathVariable Long id){
        service.deleteUser(id);
    }

    @DeleteMapping
    public void deleteUsers(){
        service.deleteAllUsers();
    }
}
