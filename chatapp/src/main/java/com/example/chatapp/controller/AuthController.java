package com.example.chatapp.controller;

import com.example.chatapp.service.TfaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.example.chatapp.dto.LoginRequest;
import com.example.chatapp.dto.RegisterRequest;
import com.example.chatapp.model.User;
import com.example.chatapp.model.Role;
import com.example.chatapp.repository.UserRepository;
import com.example.chatapp.security.JwtService;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TfaService tfaService;
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        String email = (loginRequest.getEmail() == null) ? "" : loginRequest.getEmail().trim();
        String password = (loginRequest.getPassword() == null) ? "" : loginRequest.getPassword().trim();

        if (email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }

        return userRepository.findByEmail(email)
                .map(user -> {
                    // 1. Check Password
                    if (passwordEncoder.matches(password, user.getPassword())) {

                        // 2. Check if 2FA is enabled
                        if (user.isTfaEnabled()) {
                            return ResponseEntity.ok(Map.of(
                                    "tfaRequired", true,
                                    "email", user.getEmail(),
                                    "message", "Please enter your 6-digit code or a backup code."
                            ));
                        }

                        // 3. No 2FA? Proceed with full login
                        String token = jwtService.generateToken(user);
                        return ResponseEntity.ok(Map.of(
                                "token", token,
                                "uniqueId", user.getUniqueId(),
                                "username", user.getUsername(),
                                "email", user.getEmail(),
                                "role", user.getRole(),
                                "passwordSet", user.isPasswordSet(),
                                "tfaRequired", false));
                    }
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Password");
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    @PostMapping("/login/verify-tfa")
    public ResponseEntity<?> verifyLoginTfa(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        return userRepository.findByEmail(email)
                .map(user -> {
                    // Try TOTP first, then Backup Code
                    boolean isValid = tfaService.verifyLoginCode(user, code);

                    if (isValid) {
                        String token = jwtService.generateToken(user);
                        return ResponseEntity.ok(Map.of(
                                "token", token,
                                "uniqueId", user.getUniqueId(),
                                "username", user.getUsername(),
                                "role", user.getRole()));
                    }
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid 2FA code");
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        User newUser = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(request.getRole() != null ? request.getRole() : Role.USER)
                .passwordSet(false)
                .build();

        User savedUser = userRepository.save(newUser);

        String token = jwtService.generateToken(savedUser);

        return ResponseEntity.ok(Map.of(
                "message", "User created. Please set your password.",
                "token", token,
                "uniqueId", savedUser.getUniqueId(),
                "username", savedUser.getUsername(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole(),
                "passwordSet", savedUser.isPasswordSet()));
    }
}
