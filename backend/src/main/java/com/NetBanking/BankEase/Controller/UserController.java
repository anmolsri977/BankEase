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
