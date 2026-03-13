package com.example.chatapp.controller;

import com.example.chatapp.dto.BatchSeenResponse;
import com.example.chatapp.dto.MessageRequest;
import com.example.chatapp.dto.MessageResponse;
import com.example.chatapp.dto.PermissionResponse;
import com.example.chatapp.model.Message;
import com.example.chatapp.model.MessageSeen;
import com.example.chatapp.model.MessageType;
import com.example.chatapp.model.Room;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.repository.MessageSeenRepository;
import com.example.chatapp.repository.RoomRepository;
import com.example.chatapp.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {
        private static final int DEFAULT_DISAPPEAR_DURATION_SECONDS = 120;

        private final SimpMessagingTemplate messagingTemplate;
        private final MessageRepository messageRepository;
        private final MessageSeenRepository messageSeenRepository;
        private final RoomRepository roomRepository;
        private final UserRepository userRepository;

        @MessageMapping("/chat/{roomCode}")
        public void processMessage(
                        @DestinationVariable String roomCode,
                        @Payload MessageRequest request,
                        Principal principal) {

                Room room = roomRepository.findByRoomCode(roomCode)
                                .orElseThrow(() -> new RuntimeException("Room not found"));

                User sender = userRepository.findByEmail(principal.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Message chatMessage = Message.builder()
                                .room(room)
                                .sender(sender)
                                .senderName(sender.getEmail())
                                .content(request.getContent())
                                .type(request.getType() != null ? request.getType() : MessageType.CHAT)
                                .fileUrl(request.getFileUrl())
                                .fileName(request.getFileName())
                                .contentType(request.getContentType())
                                .isDisappearing(request.getIsDisappearing() != null ? request.getIsDisappearing()
                                                : false)
                                .timestamp(LocalDateTime.now())
                                .build();

                if (chatMessage.getIsDisappearing()) {
                        int duration = request.getDuration() != null && request.getDuration() > 0
                                        ? request.getDuration()
                                        : DEFAULT_DISAPPEAR_DURATION_SECONDS;
                        chatMessage.setExpiresAt(LocalDateTime.now().plusSeconds(duration));
                }

                messageRepository.save(chatMessage);

                MessageResponse response = MessageResponse.builder()
                                .id(chatMessage.getId())
                                .senderName(chatMessage.getSenderName())
                                .content(chatMessage.getContent())
                                .type(chatMessage.getType())
                                .fileUrl(chatMessage.getFileUrl())
                                .fileName(chatMessage.getFileName())
                                .contentType(chatMessage.getContentType())
                                .isDisappearing(chatMessage.getIsDisappearing())
                                .expiresAt(chatMessage.getExpiresAt())
                                .timestamp(chatMessage.getTimestamp())
                                .roomCode(roomCode)
                                .build();

                messagingTemplate.convertAndSend("/topic/room/" + roomCode, response);
        }

        @MessageMapping("/chat/{roomCode}/seen")
        @Transactional
        public void markAsSeen(@DestinationVariable String roomCode, @Payload List<Long> messageIds,
                        Principal principal) {
                User user = userRepository.findByEmail(principal.getName()).orElseThrow();

                Set<Long> alreadySeenIds = messageSeenRepository.findAllSeenMessageIds(user.getId(), messageIds);
                List<Long> idsToProcess = messageIds.stream()
                                .filter(id -> !alreadySeenIds.contains(id))
                                .toList();

                List<Message> messages = messageRepository.findAllById(idsToProcess);

                List<MessageSeen> seenEntries = messages.stream()
                                .filter(m -> !m.getSender().getEmail().equals(user.getEmail()))
                                .filter(m -> m.getRoom().getRoomCode().equals(roomCode))
                                .map(m -> MessageSeen.builder().message(m).user(user).seenAt(LocalDateTime.now())
                                                .build())
                                .toList();

                messageSeenRepository.saveAll(seenEntries);

             
                List<Long> messageIdsList = seenEntries.stream()
                                .map(s -> s.getMessage().getId())
                                .toList();

                if (!messageIdsList.isEmpty()) {
                        BatchSeenResponse batchResponse = BatchSeenResponse.builder()
                                        .messageIds(messageIdsList)
                                        .seenBy(user.getUsername())
                                        .seenAt(LocalDateTime.now())
                                        .build();
                        messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/batch-seen", batchResponse);
                }
        }

        @MessageMapping("/chat/{roomCode}/notepad")
        @Transactional
        public void handleNotepadUpdate(@DestinationVariable String roomCode,
                        @Payload String content,
                        Principal principal) {
                Room room = roomRepository.findByRoomCode(roomCode)
                                .orElseThrow(() -> new RuntimeException("Room not found"));
                if (!room.getCreatedBy().getEmail().equals(principal.getName())) {
                        return;
                }

                room.setNotepadContent(content);
                roomRepository.save(room);

                messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/notepad", content);
        }

        @MessageMapping("/chat/{roomCode}/request-access")
        public void requestAccess(@DestinationVariable String roomCode, Principal principal) {
                Room room = roomRepository.findByRoomCode(roomCode)
                        .orElseThrow(() -> new RuntimeException("Room not found"));

                Map<String, String> requestPayload = Map.of(
                        "type", "NOTEPAD_ACCESS_REQUEST",
                        "roomCode", roomCode,
                        "username", principal.getName(),
                        "message", principal.getName() + " is requesting edit access to the notepad."
                );

                messagingTemplate.convertAndSendToUser(
                        room.getCreatedBy().getEmail(),
                        "/queue/room/" + roomCode + "/access-requests",
                        requestPayload
                );
        }

        @MessageMapping("/chat/{roomCode}/grant-access")
        @Transactional
        public void grantAccess(@DestinationVariable String roomCode, @Payload String userToGrant, Principal principal) {
                Room room = roomRepository.findByRoomCode(roomCode).orElseThrow();

                if (!room.getCreatedBy().getEmail().equals(principal.getName())) return;

                User editor = userRepository.findByEmail(userToGrant).orElseThrow();
                room.getNotepadEditors().add(editor);
                roomRepository.save(room);

                PermissionResponse permissionResponse = PermissionResponse.builder()
                        .userEmail(userToGrant)
                        .roomCode(roomCode)
                        .canEdit(true)
                        .updatedAt(LocalDateTime.now())
                        .build();

                messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/permissions", permissionResponse);
        }

        @MessageMapping("/chat/{roomCode}/revoke-access")
        @Transactional
        public void revokeAccess(@DestinationVariable String roomCode, @Payload String userToRevoke, Principal principal) {
                Room room = roomRepository.findByRoomCode(roomCode).orElseThrow();

                if (!room.getCreatedBy().getEmail().equals(principal.getName())) return;

                User editor = userRepository.findByEmail(userToRevoke).orElseThrow();
                boolean removed = room.getNotepadEditors().remove(editor);

                if (removed) {
                        roomRepository.save(room);

                        PermissionResponse permissionResponse = PermissionResponse.builder()
                                .userEmail(userToRevoke)
                                .roomCode(roomCode)
                                .canEdit(false)
                                .updatedAt(LocalDateTime.now())
                                .build();

                        messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/permissions", permissionResponse);
                }
        }
}
