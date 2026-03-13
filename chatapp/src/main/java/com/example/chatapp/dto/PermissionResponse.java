package com.example.chatapp.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponse {
    private String userEmail;
    private String roomCode;
    private boolean canEdit;
    private LocalDateTime updatedAt;
}