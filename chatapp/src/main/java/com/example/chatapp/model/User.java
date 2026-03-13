package com.example.chatapp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.userdetails.UserDetails;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(name="unique_id", nullable = false, unique = true)
    private String uniqueId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageSeen> seenMessages;

    @Column(name = "tfa_secret")
    private String tfaSecret;

    @Builder.Default
    @Column(name = "is_tfa_enabled", nullable = false)
    private boolean isTfaEnabled = false;

    @ElementCollection
    @CollectionTable(name = "user_backup_codes", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "backup_code")
    @Builder.Default
    private List<String> backupCodes = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private boolean passwordSet = false;

    @PrePersist
    public void generateUniqueId() {
        if (this.uniqueId == null || this.uniqueId.isEmpty()) {
            this.uniqueId = java.util.UUID.randomUUID().toString();
        }
    }

    @Override
    public java.util.Collection<? extends org.springframework.security.core.authority.SimpleGrantedAuthority> getAuthorities() {
        return java.util.List
                .of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

}
