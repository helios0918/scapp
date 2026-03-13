package com.example.chatapp.repository;

import com.example.chatapp.model.MessageSeen;

import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface MessageSeenRepository extends JpaRepository<MessageSeen, Long> {

    boolean existsByMessageIdAndUserId(Long messageId, Long userId);


    @Query("SELECT COUNT(m) > 0 FROM Message m WHERE m.id = :messageId AND m.room.roomCode = :roomCode")
    boolean isValidMessageForRoom(Long messageId, String roomCode);

    @Query("SELECT ms.message.id FROM MessageSeen ms WHERE ms.user.id = :userId AND ms.message.id IN :messageIds")
    Set<Long> findAllSeenMessageIds(Long userId, List<Long> messageIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM MessageSeen ms WHERE ms.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
