package com.example.chatapp.repository;

import com.example.chatapp.model.Message;

import jakarta.transaction.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("SELECT m FROM Message m WHERE m.room.roomCode = :roomCode ORDER BY m.timestamp ASC")
    List<Message> findByRoomCodeWithLimit(@Param("roomCode") String roomCode);

    @Query("""
            SELECT m FROM Message m
            WHERE m.room.roomCode = :roomCode
            AND (m.expiresAt IS NULL OR m.expiresAt > :now)
            ORDER BY m.timestamp ASC
            """)
    List<Message> findActiveByRoomCode(@Param("roomCode") String roomCode, @Param("now") LocalDateTime now);

   
    List<Message> findTop50ByRoomRoomCodeOrderByTimestampAsc(String roomCode);

    @Query("SELECT COUNT(ms) > 0 FROM MessageSeen ms WHERE ms.message.id = :messageId AND ms.user.id = :userId")
    boolean existsByMessageIdAndUserId(@Param("messageId") Long messageId, @Param("userId") Long userId);

    boolean existsById(Long messageId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Message m WHERE m.expiresAt < :now")
    void deleteByExpiresAtBefore(@Param("now") LocalDateTime now);

    List<Message> findByExpiresAtBefore(LocalDateTime now);

}

