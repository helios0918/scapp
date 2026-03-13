package com.example.chatapp.security;

import com.example.chatapp.model.Role;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        if (name == null || name.isEmpty()) {
            name = oAuth2User.getAttribute("login");
        }
        if (name == null || name.isEmpty()) {
            name = email.split("@")[0];
        }

        final String finalName = name;

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .username(finalName)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.USER)
                            .passwordSet(false)
                            .build();
                    return userRepository.save(newUser);
                });

        String token = jwtService.generateToken(user);
        String redirectUrl = "https://scappli.netlify.app/oauth2/callback?token=" + token +
                "&username=" + user.getUsername() +
                "&email=" + user.getEmail();
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
<<<<<<< HEAD
}
//*//
=======
}
>>>>>>> 57d606a0c91908602b91106d61b087382adda27d
