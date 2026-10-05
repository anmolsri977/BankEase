package com.NetBanking.BankEase.Service;

import com.NetBanking.BankEase.Entity.User;
import com.NetBanking.BankEase.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    UserRepository repo;
    public void addUser(User user){
        repo.save(user);
    }

    public List<User> getAllUsers(){
        return repo.findAll();

    }

    public Optional<User> getUserById(Long id){
        return repo.findById(id);
    }

    public String updateUser(User user){
        repo.save(user);
        return "Updated user successfully";
    }

    public Optional<User> getUserByEmail(String email) {
        return repo.findByEmail(email);
    }

    public User updateProfile(com.NetBanking.BankEase.Dto.UpdateProfileRequest request, String email) {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        if (request != null) {
            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                if (request.getName().trim().length() < 2) {
                    throw new IllegalArgumentException("Name must have at least 2 characters");
                }
                user.setName(request.getName().trim());
            }
            if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
                String phone = request.getPhone().trim();
                if (!phone.matches("^[6-9]\\d{9}$")) {
                    throw new IllegalArgumentException("Invalid phone number. Must be 10 digits starting with 6, 7, 8, or 9.");
                }
                user.setPhone(phone);
            }
        }
        return repo.save(user);
    }

    public void deleteUser(Long id){
        repo.deleteById(id);
    }

    public void deleteAllUsers(){
        repo.deleteAll();
    }
}
