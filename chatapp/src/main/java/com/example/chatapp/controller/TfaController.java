package com.example.chatapp.controller;

import com.example.chatapp.service.TfaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/tfa")
@RequiredArgsConstructor
public class TfaController {

    private final TfaService tfaService;

    @GetMapping("/setup")
    public ResponseEntity<?> setup(Principal principal) {
        return ResponseEntity.ok(tfaService.setupTfa(principal.getName()));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> request, Principal principal) {
        String code = request.get("code");
        if (code == null || !code.matches("\\d{6}")) {
            return ResponseEntity.badRequest().body("Invalid 6-digit code format.");
        }

        if (tfaService.verifyAndEnableTfa(principal.getName(), code)) {
            return ResponseEntity.ok("2FA Enabled Successfully");
        }
        return ResponseEntity.badRequest().body("Invalid verification code.");
    }

    @PostMapping("/disable")
    public ResponseEntity<?> disable(@RequestBody Map<String, String> request, Principal principal) {
        String code = request.get("code");
        if (code == null || !code.matches("\\d{6}")) {
            return ResponseEntity.badRequest().body("Code is required to disable 2FA.");
        }

        if (tfaService.disableTfa(principal.getName(), code)) {
            return ResponseEntity.ok("2FA Disabled Successfully");
        }
        return ResponseEntity.badRequest().body("Verification failed. 2FA remains active.");
    }

    @PostMapping("/backup-codes")
    public ResponseEntity<?> getBackupCodes(Principal principal) {
        List<String> codes = tfaService.generateBackupCodes(principal.getName());
        return ResponseEntity.ok(Map.of("backupCodes", codes));
    }
}