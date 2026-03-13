package com.example.chatapp.dto;

import com.example.chatapp.model.MessageType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private String senderName;
    private String content;
    private MessageType type;
    private LocalDateTime timestamp;
    private String roomCode;
    private int seenCount;
    private List<String> seenBy;
    private boolean isSeenByMe;

    private String fileUrl;
    private String fileName;
    private String contentType;
    private Boolean isDisappearing;
    private LocalDateTime expiresAt;
}