package com.example.chatapp.controller;

import java.util.Map;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GoogleAuthenticator gAuth;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userRepository.findByEmail(email).orElseThrow());
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (updates.containsKey("username"))
            user.setUsername(updates.get("username"));

        userRepository.save(user);
        return ResponseEntity.ok("Profile updated successfully");
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        String tfaCode = request.get("tfaCode");

        if (oldPassword == null || oldPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Current password is required");
        }

        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body("New password is required");
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        }

        if (user.getPassword() == null || !user.isPasswordSet()) {
            return ResponseEntity.badRequest().body("Password has not been set yet");
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body("Incorrect current password");
        }

        if (user.isTfaEnabled()) {
            if (tfaCode == null || !tfaCode.matches("\\d{6}")) {
                return ResponseEntity.badRequest().body("Invalid authenticator code.");
            }
            if (!gAuth.authorize(user.getTfaSecret(), Integer.parseInt(tfaCode))) {
                return ResponseEntity.badRequest().body("Invalid authenticator code.");
            }
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok("Password updated successfully");
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        String password = request.get("password");
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body("Password is required.");
        }

        if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body("Incorrect password.");
        }

        if (user.isTfaEnabled()) {
            String code = request.get("tfaCode");
            if (code == null || !code.matches("\\d{6}")) {
                return ResponseEntity.status(401).body("Invalid Authenticator code.");
            }
            if (!gAuth.authorize(user.getTfaSecret(), Integer.parseInt(code))) {
                return ResponseEntity.status(401).body("Invalid Authenticator code.");
            }
        }

        userRepository.delete(user);
        return ResponseEntity.ok("Account deleted.");
    }
}
