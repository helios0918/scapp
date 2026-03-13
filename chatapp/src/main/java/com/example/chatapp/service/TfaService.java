package com.example.chatapp.service;

import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TfaService {

    private final UserRepository userRepository;
    private final GoogleAuthenticator gAuth;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public List<String> generateBackupCodes(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();

        List<String> codes = IntStream.range(0, 10)
                .mapToObj(i -> generateRandomCode())
                .collect(Collectors.toList());

        user.setBackupCodes(codes);
        userRepository.save(user);
        return codes;
    }

    private String generateRandomCode() {
        return String.format("%08x", secureRandom.nextInt());
    }

    public boolean useBackupCode(User user, String code) {
        if (user.getBackupCodes().contains(code)) {
            user.getBackupCodes().remove(code);
            userRepository.save(user);
            return true;
        }
        return false;
    }



    @Transactional
    public Map<String, String> setupTfa(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String secret = gAuth.createCredentials().getKey();
        user.setTfaSecret(secret);
        userRepository.save(user);

        String qrCodeUrl = String.format("otpauth://totp/ChatApp:%s?secret=%s&issuer=ChatApp", email, secret);
        return Map.of("secret", secret, "qrCodeUrl", qrCodeUrl);
    }

    @Transactional
    public boolean verifyAndEnableTfa(String email, String rawCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTfaSecret() == null) return false;

        if (gAuth.authorize(user.getTfaSecret(), Integer.parseInt(rawCode))) {
            user.setTfaEnabled(true);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean disableTfa(String email, String providedCode) {
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!user.isTfaEnabled()) return false;

        boolean isTotpValid = gAuth.authorize(user.getTfaSecret(), Integer.parseInt(providedCode));

        boolean isBackupValid = !isTotpValid && useBackupCode(user, providedCode);

        if (isTotpValid || isBackupValid) {
            user.setTfaSecret(null);
            user.setTfaEnabled(false);
            user.getBackupCodes().clear();
            userRepository.save(user);
            return true;
        }
        return false;
    }

    public boolean verifyLoginCode(User user, String code) {
        if (code == null) return false;

        if (code.matches("\\d{6}")) {
            if (gAuth.authorize(user.getTfaSecret(), Integer.parseInt(code))) {
                return true;
            }
        }
        return useBackupCode(user, code);
    }
}
