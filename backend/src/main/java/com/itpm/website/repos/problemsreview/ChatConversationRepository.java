package com.itpm.website.repos.problemsreview;

import com.itpm.website.enities.problemsreview.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    @EntityGraph(attributePaths = "messages")
    Optional<ChatConversation> findByTypeAndOwnerUserId(String type, Long ownerUserId);

    @EntityGraph(attributePaths = "messages")
    Optional<ChatConversation> findByTypeAndParticipantOneIdAndParticipantTwoId(String type, Long participantOneId, Long participantTwoId);

    @EntityGraph(attributePaths = "messages")
    List<ChatConversation> findByTypeOrderByUpdatedAtDesc(String type);

    @EntityGraph(attributePaths = "messages")
    @Query("""
            select c
            from ChatConversation c
            where c.type = 'DIRECT'
            and (c.participantOneId = :userId or c.participantTwoId = :userId)
            order by c.updatedAt desc
            """)
    List<ChatConversation> findDirectConversationsForUser(Long userId);

    @EntityGraph(attributePaths = "messages")
    @Query("""
            select c
            from ChatConversation c
            where c.id = :conversationId
            """)
    Optional<ChatConversation> findConversationWithMessagesById(@Param("conversationId") Long conversationId);
}
