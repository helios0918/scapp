package com.example.chatapp.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.chatapp.dto.PasswordUpdateRequest;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class SetPasswordController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/set-password")
    public ResponseEntity<?> setPassword(@Valid @RequestBody PasswordUpdateRequest request, Principal principal) {
        String email = principal.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isPasswordSet()) {
            return ResponseEntity.badRequest().body("Error: Password has already been set for this account.");
        }

        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        if (confirmPassword != null && !confirmPassword.isBlank() && !confirmPassword.equals(newPassword)) {
            return ResponseEntity.badRequest().body("Passwords do not match.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordSet(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password initialized successfully!"));
    }
}
