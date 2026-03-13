package com.example.chatapp.dto;

import com.example.chatapp.model.MessageType;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    private String content;

    private MessageType type;

    private String fileUrl;

    private Integer duration;

    private String fileName;

    private String contentType;

    private Boolean isDisappearing;
}