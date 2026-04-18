package com.itpm.website.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itpm.website.dtos.problemsreview.ChatConversationDto;
import com.itpm.website.enities.User;
import com.itpm.website.enities.problemsreview.ChatConversation;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.service.problemsreview.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class SupportWebSocketHandler extends TextWebSocketHandler {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final SupportService supportService;
    private final UserRepo userRepo;
    private final ObjectMapper objectMapper;

    private final Map<Long, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    private final Set<WebSocketSession> adminSessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = getUserId(session);
        String role = getRole(session);

        if (userId == null || role == null || role.isBlank()) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        userSessions.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
        if (ROLE_ADMIN.equals(role)) {
            adminSessions.add(session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        adminSessions.remove(session);

        Long userId = getUserId(session);
        if (userId == null) {
            return;
        }

        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null) {
            return;
        }

        sessions.remove(session);
        if (sessions.isEmpty()) {
            userSessions.remove(userId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        sendPayload(session, Map.of(
                "type", "ERROR",
                "message", "Use the HTTP chat endpoints for send, edit, and delete actions."
        ));
    }

    public void broadcastConversationUpdate(ChatConversation conversation) {
        Set<WebSocketSession> sessions = resolveTargetSessions(conversation);
        sessions.forEach(session -> sendConversationPayload(session, conversation));
    }

    private Set<WebSocketSession> resolveTargetSessions(ChatConversation conversation) {
        Set<WebSocketSession> targetSessions = new HashSet<>();

        if (supportService.isSupportConversation(conversation)) {
            Long ownerId = supportService.getSupportOwnerId(conversation);
            if (ownerId != null) {
                targetSessions.addAll(userSessions.getOrDefault(ownerId, Set.of()));
            }
            targetSessions.addAll(adminSessions);
            return targetSessions;
        }

        for (Long participantId : supportService.getDirectParticipantIds(conversation)) {
            if (participantId == null) {
                continue;
            }
            targetSessions.addAll(userSessions.getOrDefault(participantId, Set.of()));
        }

        return targetSessions;
    }

    private void sendConversationPayload(WebSocketSession session, ChatConversation conversation) {
        if (!session.isOpen()) {
            unregisterSession(session);
            return;
        }

        try {
            User viewer = loadUser(session);
            if (viewer == null) {
                unregisterSession(session);
                closeQuietly(session);
                return;
            }

            ChatConversationDto dto = supportService.toConversationDto(conversation, viewer);
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CONVERSATION_UPDATED");
            payload.put("conversation", dto);
            sendPayload(session, payload);
        } catch (RuntimeException ignored) {
            unregisterSession(session);
        }
    }

    private void sendPayload(WebSocketSession session, Map<String, Object> payload) {
        if (!session.isOpen()) {
            unregisterSession(session);
            return;
        }
        try {
            synchronized (session) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            }
        } catch (IOException | IllegalStateException ignored) {
            unregisterSession(session);
            closeQuietly(session);
        }
    }

    private User loadUser(WebSocketSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return null;
        }
        return userRepo.findById(userId).orElse(null);
    }

    private Long getUserId(WebSocketSession session) {
        Object value = session.getAttributes().get("userId");
        if (value instanceof Long longValue) {
            return longValue;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private String getRole(WebSocketSession session) {
        Object value = session.getAttributes().get("role");
        return value != null ? value.toString() : null;
    }

    private void unregisterSession(WebSocketSession session) {
        adminSessions.remove(session);

        Long userId = getUserId(session);
        if (userId == null) {
            return;
        }

        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null) {
            return;
        }

        sessions.remove(session);
        if (sessions.isEmpty()) {
            userSessions.remove(userId);
        }
    }

    private void closeQuietly(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.close();
            }
        } catch (IOException ignored) {
            // Ignore close failures.
        }
    }
}

