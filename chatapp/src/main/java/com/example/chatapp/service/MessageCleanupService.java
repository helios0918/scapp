package com.example.chatapp.service;

import com.example.chatapp.model.Message;
import com.example.chatapp.repository.MessageRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageCleanupService {

    private final MessageRepository messageRepository;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 5000)
    @Transactional
    public void cleanup() {
        LocalDateTime now = LocalDateTime.now();
        List<Message> expiredMessages = messageRepository.findByExpiresAtBefore(now);
        if (expiredMessages.isEmpty()) {
            return;
        }

        for (Message msg : expiredMessages) {
            if (msg.getFileUrl() != null) {
                fileStorageService.delete(msg.getFileUrl());
            }
        }

        Map<String, List<Long>> expiredByRoom = expiredMessages.stream()
                .collect(Collectors.groupingBy(
                        msg -> msg.getRoom().getRoomCode(),
                        Collectors.mapping(Message::getId, Collectors.toList())));

        messageRepository.deleteAll(expiredMessages);

        expiredByRoom.forEach((roomCode, messageIds) -> messagingTemplate.convertAndSend(
                "/topic/room/" + roomCode + "/expired",
                (Object) Map.of("messageIds", messageIds, "expiredAt", now)));
    }
}
