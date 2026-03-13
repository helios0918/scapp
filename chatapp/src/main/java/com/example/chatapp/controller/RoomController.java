package com.example.chatapp.controller;

import com.example.chatapp.dto.MessageResponse;
import com.example.chatapp.dto.JoinRoomRequest;
import com.example.chatapp.dto.RoomRequest;
import com.example.chatapp.model.Room;
import com.example.chatapp.model.User;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.repository.RoomRepository;
import com.example.chatapp.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

        private final RoomRepository roomRepository;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final MessageRepository messageRepository;

        @PostMapping("/create")
        public ResponseEntity<?> createRoom(@Valid @RequestBody RoomRequest request) {

                String email = SecurityContextHolder.getContext().getAuthentication().getName();

                User creator = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                String generatedCode;

                do {
                        generatedCode = UUID.randomUUID()
                                        .toString()
                                        .substring(0, 8)
                                        .toUpperCase();
                } while (roomRepository.findByRoomCode(generatedCode).isPresent());

                String description = request.getDescription();

                if (description == null || description.trim().isEmpty()) {
                        description = "Private collaboration Arc";
                }

                Room newRoom = Room.builder()
                                .roomCode(generatedCode)
                                .password(passwordEncoder.encode(request.getPassword()))
                                .description(description)
                                .createdBy(creator)
                                .build();

                roomRepository.save(newRoom);

                return ResponseEntity.ok(Map.of(
                                "message", "Room created successfully!",
                                "roomCode", generatedCode,
                                "roomId", newRoom.getId(),
                                "description", newRoom.getDescription()));
        }

        @PostMapping("/join")
        public ResponseEntity<?> joinRoom(@Valid @RequestBody JoinRoomRequest request) {
                String code = request.getRoomCode().trim().toUpperCase();
                String inputPassword = request.getPassword().trim();
                String email = SecurityContextHolder.getContext().getAuthentication().getName();

                User user = userRepository.findByEmail(email).orElseThrow();
                Room room = roomRepository.findByRoomCode(code)
                                .orElseThrow(() -> new RuntimeException("Room not found"));
                boolean isOwner = room.getCreatedBy().getEmail().equals(email);
                boolean isPasswordCorrect = passwordEncoder.matches(inputPassword, room.getPassword());

                if (isOwner || isPasswordCorrect) {

                        boolean isAlreadyMember = room.getMembers().contains(user);
                        if (!isOwner && !isAlreadyMember) {
                                room.getMembers().add(user);
                                roomRepository.save(room);
                        }

                        return ResponseEntity.ok(Map.of(
                                "message", "Joined",
                                "roomId", room.getId(),
                                "roomCode", room.getRoomCode()));
                }

                if (room.getCreatedBy().getEmail().equals(email) ||
                                passwordEncoder.matches(inputPassword, room.getPassword())) {

                        room.getMembers().add(user);
                        roomRepository.save(room);

                        return ResponseEntity.ok(Map.of(
                                        "message", "Joined",
                                        "roomId", room.getId(),
                                        "roomCode", room.getRoomCode()));
                }

                return ResponseEntity.status(401).body("Incorrect Room Password");
        }

        @GetMapping("/categorized")
        public ResponseEntity<?> getCategorizedRoomCodes() {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByEmail(email).orElseThrow();

                return ResponseEntity.ok(Map.of(
                                "owned", roomRepository.findByCreatedBy(user).stream().map(Room::getRoomCode).toList(),
                                "joined",
                                roomRepository.findJoinedRooms(user.getId()).stream().map(Room::getRoomCode).toList()));
        }

        @GetMapping("/{roomCode}/messages")
        public ResponseEntity<List<MessageResponse>> getMessageHistory(@PathVariable String roomCode) {
                return ResponseEntity.ok(
                                messageRepository.findActiveByRoomCode(roomCode, LocalDateTime.now()).stream()
                                                .map(m -> MessageResponse.builder()
                                                                .id(m.getId())
                                                                .senderName(m.getSenderName())
                                                                .content(m.getContent())
                                                                .timestamp(m.getTimestamp())
                                                                .type(m.getType())
                                                                .fileUrl(m.getFileUrl())
                                                                .fileName(m.getFileName())
                                                                .contentType(m.getContentType())
                                                                .isDisappearing(m.getIsDisappearing())
                                                                .expiresAt(m.getExpiresAt())
                                                                .roomCode(roomCode)
                                                                .build())
                                                .collect(Collectors.toList()));
        }

        @GetMapping("/all-categorized")
        public ResponseEntity<?> getAllCategorizedDetails() {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                List<Map<String, Object>> ownedRooms = roomRepository.findByCreatedBy(user).stream()
                                .map(r -> Map.<String, Object>of(
                                                "roomCode", r.getRoomCode(),
                                                "description", r.getDescription() != null ? r.getDescription() : "",
                                                "createdAt",
                                                r.getCreatedAt() != null ? r.getCreatedAt().toString() : ""))
                                .toList();

                List<Map<String, Object>> joinedRooms = roomRepository.findJoinedRooms(user.getId()).stream()
                                .map(r -> Map.<String, Object>of(
                                                "roomCode", r.getRoomCode(),
                                                "description", r.getDescription() != null ? r.getDescription() : "",
                                                "createdBy", r.getCreatedBy().getUsername()))
                                .toList();

                return ResponseEntity.ok(Map.of(
                                "owned", ownedRooms,
                                "joined", joinedRooms));
        }

        @DeleteMapping("/{roomCode}")
        public ResponseEntity<?> deleteRoom(@PathVariable String roomCode) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();

                Room room = roomRepository.findByRoomCode(roomCode)
                        .orElseThrow(() -> new RuntimeException("Room not found"));

                if (!room.getCreatedBy().getEmail().equals(email)) {
                        return ResponseEntity.status(403).body("Only the owner can delete this room.");
                }

                roomRepository.delete(room);

                return ResponseEntity.ok(Map.of(
                        "message", "Room deleted successfully!",
                        "roomCode", roomCode
                ));
        }

        @GetMapping("/{roomCode}/members")
        public ResponseEntity<?> getRoomMembers(@PathVariable String roomCode) {
                Room room = roomRepository.findByRoomCode(roomCode)
                        .orElseThrow(() -> new RuntimeException("Room not found"));

                List<Map<String, Object>> members = new java.util.ArrayList<>();

                // Add Owner
                User owner = room.getCreatedBy();
                members.add(Map.of(
                        "email", owner.getEmail(),
                        "username", owner.getUsername() != null ? owner.getUsername() : owner.getEmail().split("@")[0],
                        "isOwner", true
                ));

                room.getMembers().stream()
                        .filter(m -> !m.getEmail().equals(owner.getEmail()))
                        .forEach(m -> members.add(Map.of(
                                "email", m.getEmail(),
                                "username", m.getUsername() != null ? m.getUsername() : m.getEmail().split("@")[0],
                                "isOwner", false
                        )));

                return ResponseEntity.ok(members);
        }
}
