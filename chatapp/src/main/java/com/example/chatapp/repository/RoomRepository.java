package com.example.chatapp.repository;

import com.example.chatapp.model.Room;
import com.example.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomCode(String roomCode);

    List<Room> findByCreatedBy(User user);

    @Query("SELECT r FROM Room r JOIN r.members m WHERE m.id = :userId AND r.createdBy.id != :userId")
    List<Room> findJoinedRooms(@Param("userId") Long userId);

    List<Room> findAllByMembersContaining(User user);

    @Query("SELECT COUNT(r) > 0 FROM Room r " +
            "LEFT JOIN r.notepadEditors e " +
            "WHERE r.roomCode = :roomCode " +
            "AND (r.createdBy.id = :userId OR e.id = :userId)")
    boolean canUserEditNotepad(@Param("roomCode") String roomCode, @Param("userId") Long userId);


}