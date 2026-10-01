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

    public void deleteUser(Long id){
        repo.deleteById(id);
    }

    public void deleteAllUsers(){
        repo.deleteAll();
    }
}
