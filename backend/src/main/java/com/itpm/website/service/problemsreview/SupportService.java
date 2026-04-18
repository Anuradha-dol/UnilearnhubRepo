package com.itpm.website.service.problemsreview;

import com.itpm.website.dtos.problemsreview.*;
import com.itpm.website.enities.User;
import com.itpm.website.enities.problemsreview.ChatConversation;
import com.itpm.website.enities.problemsreview.ChatMessage;
import com.itpm.website.enities.problemsreview.SupportQuestion;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.problemsreview.ChatConversationRepository;
import com.itpm.website.repos.problemsreview.ChatMessageRepository;
import com.itpm.website.repos.problemsreview.SupportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupportService {

    public static final String TYPE_SUPPORT = "SUPPORT";
    public static final String TYPE_DIRECT = "DIRECT";
    private static final String STATUS_OPEN = "OPEN";
    private static final String STATUS_ANSWERED = "ANSWERED";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepo userRepo;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public ChatBootstrapDto getBootstrap(User viewer) {
        List<ChatConversation> supportConversations = isAdmin(viewer)
                ? conversationRepository.findByTypeOrderByUpdatedAtDesc(TYPE_SUPPORT)
                : conversationRepository.findByTypeAndOwnerUserId(TYPE_SUPPORT, viewer.getUserId())
                .map(List::of)
                .orElse(List.of());

        List<ChatConversation> directConversations = conversationRepository.findDirectConversationsForUser(viewer.getUserId());

        Set<Long> relevantUserIds = collectRelevantUserIds(supportConversations, directConversations);
        relevantUserIds.add(viewer.getUserId());

        Map<Long, User> userMap = userRepo.findAllById(relevantUserIds).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));

        List<ChatConversationDto> supportDtos = supportConversations.stream()
                .map(conversation -> toConversationDto(conversation, viewer, userMap))
                .toList();

        List<ChatConversationDto> directDtos = directConversations.stream()
                .map(conversation -> toConversationDto(conversation, viewer, userMap))
                .toList();

        List<ChatContactDto> contacts = buildContacts(viewer, false);
        List<ChatContactDto> adminContacts = buildContacts(viewer, true);

        return new ChatBootstrapDto(
                toContact(viewer),
                supportDtos,
                directDtos,
                contacts,
                adminContacts
        );
    }

    @Transactional(readOnly = true)
    public List<ChatContactDto> searchContacts(User viewer, String firstNameQuery) {
        return buildContacts(viewer, firstNameQuery, false);
    }

    @Transactional
    public ChatConversation createOrGetSupportConversation(User user) {
        ensureRegularUser(user);
        return conversationRepository.findByTypeAndOwnerUserId(TYPE_SUPPORT, user.getUserId())
                .orElseGet(() -> {
                    ChatConversation conversation = new ChatConversation();
                    conversation.setType(TYPE_SUPPORT);
                    conversation.setStatus(STATUS_OPEN);
                    conversation.setOwnerUserId(user.getUserId());
                    conversation.setCreatedAt(LocalDateTime.now());
                    conversation.setUpdatedAt(LocalDateTime.now());
                    return conversationRepository.save(conversation);
                });
    }

    @Transactional
    public ChatConversation createOrGetDirectConversation(User actor, Long recipientId) {
        if (recipientId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipient is required");
        }
        if (actor.getUserId().equals(recipientId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot start a chat with yourself");
        }

        User recipient = userRepo.findById(recipientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        long participantOneId = Math.min(actor.getUserId(), recipientId);
        long participantTwoId = Math.max(actor.getUserId(), recipientId);

        return conversationRepository.findByTypeAndParticipantOneIdAndParticipantTwoId(
                        TYPE_DIRECT,
                        participantOneId,
                        participantTwoId
                )
                .orElseGet(() -> {
                    ChatConversation conversation = new ChatConversation();
                    conversation.setType(TYPE_DIRECT);
                    conversation.setStatus(STATUS_ACTIVE);
                    conversation.setParticipantOneId(participantOneId);
                    conversation.setParticipantTwoId(participantTwoId);
                    conversation.setCreatedAt(LocalDateTime.now());
                    conversation.setUpdatedAt(LocalDateTime.now());
                    return conversationRepository.save(conversation);
                });
    }

    @Transactional
    public ChatConversation sendMessage(Long conversationId, User sender, String content, MultipartFile attachment) {
        validateMessageContent(content, attachment);
        ChatConversation conversation = requireConversationAccess(conversationId, sender);

        ChatAttachment storedAttachment = storeAttachment(attachment);
        LocalDateTime now = LocalDateTime.now();

        ChatMessage message = new ChatMessage();
        message.setSenderId(sender.getUserId());
        message.setSenderRole(sender.getRole().name());
        message.setSenderName(displayName(sender));
        message.setContent(cleanContent(content));
        message.setCreatedAt(now);
        message.setUpdatedAt(now);

        if (storedAttachment != null) {
            message.setAttachmentUrl(storedAttachment.url());
            message.setAttachmentName(storedAttachment.name());
            message.setAttachmentContentType(storedAttachment.contentType());
            message.setAttachmentKind(storedAttachment.kind());
            message.setAttachmentSize(storedAttachment.size());
        }

        conversation.addMessage(message);
        conversation.setUpdatedAt(now);
        conversation.setStatus(resolveConversationStatus(conversation, sender));
        return conversationRepository.save(conversation);
    }

    @Transactional
    public ChatConversation updateMessage(Long conversationId, Long messageId, User actor, String content) {
        ChatConversation conversation = requireConversationAccess(conversationId, actor);
        ChatMessage message = requireOwnMessage(conversation.getId(), messageId, actor);

        String cleanedContent = cleanContent(content);
        if ((cleanedContent == null || cleanedContent.isBlank()) && message.getAttachmentUrl() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be blank");
        }

        message.setContent(cleanedContent);
        message.setEdited(true);
        message.setUpdatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    @Transactional
    public ChatConversation deleteMessage(Long conversationId, Long messageId, User actor) {
        ChatConversation conversation = requireConversationAccess(conversationId, actor);
        ChatMessage message = requireOwnMessage(conversation.getId(), messageId, actor);

        deleteAttachmentFile(message.getAttachmentUrl());
        conversation.removeMessage(message);
        syncConversationAfterMessageChange(conversation);
        return conversationRepository.save(conversation);
    }

    @Transactional(readOnly = true)
    public ChatConversation requireConversationAccess(Long conversationId, User actor) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (TYPE_SUPPORT.equals(conversation.getType())) {
            if (isAdmin(actor) || actor.getUserId().equals(conversation.getOwnerUserId())) {
                return conversation;
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this support chat");
        }

        if (actor.getUserId().equals(conversation.getParticipantOneId()) || actor.getUserId().equals(conversation.getParticipantTwoId())) {
            return conversation;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this conversation");
    }

    @Transactional(readOnly = true)
    public ChatConversationDto toConversationDto(ChatConversation conversation, User viewer) {
        ChatConversation hydratedConversation = loadConversationForRendering(conversation);
        return toConversationDto(hydratedConversation, viewer, loadUserMapForConversation(hydratedConversation, viewer));
    }

    @Transactional(readOnly = true)
    public boolean isSupportConversation(ChatConversation conversation) {
        return TYPE_SUPPORT.equals(conversation.getType());
    }

    @Transactional(readOnly = true)
    public Long getSupportOwnerId(ChatConversation conversation) {
        return conversation.getOwnerUserId();
    }

    @Transactional(readOnly = true)
    public List<Long> getDirectParticipantIds(ChatConversation conversation) {
        return List.of(conversation.getParticipantOneId(), conversation.getParticipantTwoId());
    }

    private ChatConversationDto toConversationDto(ChatConversation conversation, User viewer, Map<Long, User> userMap) {
        ChatContactDto partner = resolvePartner(conversation, viewer, userMap);

        List<ChatMessageDto> messages = conversation.getMessages().stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt).thenComparing(ChatMessage::getId))
                .map(message -> toMessageDto(message, viewer))
                .toList();

        String title;
        String subtitle;
        if (TYPE_SUPPORT.equals(conversation.getType())) {
            if (isAdmin(viewer)) {
                User owner = userMap.get(conversation.getOwnerUserId());
                title = owner != null ? displayName(owner) : "Support User";
                subtitle = owner != null ? owner.getEmail() : "Support request";
            } else {
                title = "Support Team";
                subtitle = "Private help from admins";
            }
        } else {
            title = partner != null ? partner.name() : "Direct Message";
            subtitle = partner != null ? partner.email() : "Private conversation";
        }

        return new ChatConversationDto(
                conversation.getId(),
                conversation.getType(),
                conversation.getStatus(),
                title,
                subtitle,
                TYPE_SUPPORT.equals(conversation.getType()),
                partner,
                conversation.getCreatedAt(),
                conversation.getUpdatedAt(),
                messages
        );
    }

    private ChatMessageDto toMessageDto(ChatMessage message, User viewer) {
        boolean mine = viewer.getUserId().equals(message.getSenderId());
        boolean editable = mine && message.getContent() != null && !message.getContent().isBlank();
        boolean deletable = mine;

        ChatAttachmentDto attachment = null;
        if (message.getAttachmentUrl() != null && !message.getAttachmentUrl().isBlank()) {
            attachment = new ChatAttachmentDto(
                    message.getAttachmentKind(),
                    message.getAttachmentName(),
                    message.getAttachmentUrl(),
                    message.getAttachmentContentType(),
                    message.getAttachmentSize()
            );
        }

        return new ChatMessageDto(
                message.getId(),
                message.getSenderId(),
                message.getSenderName(),
                message.getSenderRole(),
                message.getContent(),
                attachment,
                message.getCreatedAt(),
                message.getUpdatedAt(),
                message.isEdited(),
                mine,
                editable,
                deletable
        );
    }

    private ChatMessage requireOwnMessage(Long conversationId, Long messageId, User actor) {
        ChatMessage message = messageRepository.findByIdAndConversationId(messageId, conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        if (!actor.getUserId().equals(message.getSenderId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only change your own messages");
        }

        return message;
    }

    private ChatConversation loadConversationForRendering(ChatConversation conversation) {
        if (conversation == null || conversation.getId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found");
        }

        return conversationRepository.findConversationWithMessagesById(conversation.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
    }

    private Map<Long, User> loadUserMapForConversation(ChatConversation conversation, User viewer) {
        Set<Long> ids = collectRelevantUserIds(List.of(conversation), List.of());
        ids.add(viewer.getUserId());
        return userRepo.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
    }

    private Set<Long> collectRelevantUserIds(List<ChatConversation> supportConversations, List<ChatConversation> directConversations) {
        Set<Long> ids = supportConversations.stream()
                .map(ChatConversation::getOwnerUserId)
                .collect(Collectors.toSet());

        directConversations.forEach(conversation -> {
            if (conversation.getParticipantOneId() != null) {
                ids.add(conversation.getParticipantOneId());
            }
            if (conversation.getParticipantTwoId() != null) {
                ids.add(conversation.getParticipantTwoId());
            }
        });

        return ids;
    }

    private List<ChatContactDto> buildContacts(User viewer) {
        return buildContacts(viewer, false);
    }

    private List<ChatContactDto> buildContacts(User viewer, boolean adminContacts) {
        return buildContacts(viewer, null, adminContacts);
    }

    private List<ChatContactDto> buildContacts(User viewer, String firstNameQuery) {
        return buildContacts(viewer, firstNameQuery, false);
    }

    private List<ChatContactDto> buildContacts(User viewer, String firstNameQuery, boolean adminContacts) {
        String normalizedQuery = normalizeSearchQuery(firstNameQuery);

        List<User> candidates = normalizedQuery == null
                ? userRepo.findAllByOrderByFirstnameAscLastNameAsc()
                : userRepo.findByFirstnameContainingIgnoreCaseOrderByFirstnameAscLastNameAsc(normalizedQuery);

        return candidates.stream()
                .filter(contact -> !contact.getUserId().equals(viewer.getUserId()))
                .filter(contact -> adminContacts == isAdmin(contact))
                .sorted(Comparator.comparing(this::displayName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toContact)
                .toList();
    }

    private ChatContactDto resolvePartner(ChatConversation conversation, User viewer, Map<Long, User> userMap) {
        if (TYPE_SUPPORT.equals(conversation.getType())) {
            if (isAdmin(viewer)) {
                User owner = userMap.get(conversation.getOwnerUserId());
                return owner != null ? toContact(owner) : null;
            }
            return new ChatContactDto(null, null, null, "Support Team", "Admins", null, "SUPPORT", null);
        }

        Long partnerId = viewer.getUserId().equals(conversation.getParticipantOneId())
                ? conversation.getParticipantTwoId()
                : conversation.getParticipantOneId();

        User partner = userMap.get(partnerId);
        return partner != null ? toContact(partner) : null;
    }

    private String resolveConversationStatus(ChatConversation conversation, User sender) {
        if (TYPE_DIRECT.equals(conversation.getType())) {
            return STATUS_ACTIVE;
        }
        return isAdmin(sender) ? STATUS_ANSWERED : STATUS_OPEN;
    }

    private void syncConversationAfterMessageChange(ChatConversation conversation) {
        LocalDateTime latestActivity = conversation.getMessages().stream()
                .map(ChatMessage::getUpdatedAt)
                .max(LocalDateTime::compareTo)
                .orElse(conversation.getCreatedAt());

        conversation.setUpdatedAt(latestActivity);

        if (TYPE_DIRECT.equals(conversation.getType())) {
            conversation.setStatus(STATUS_ACTIVE);
            return;
        }

        ChatMessage latestMessage = conversation.getMessages().stream()
                .max(Comparator.comparing(ChatMessage::getCreatedAt).thenComparing(ChatMessage::getId))
                .orElse(null);

        if (latestMessage == null) {
            conversation.setStatus(STATUS_OPEN);
            return;
        }

        conversation.setStatus(ROLE_ADMIN.equals(latestMessage.getSenderRole()) ? STATUS_ANSWERED : STATUS_OPEN);
    }

    private void validateMessageContent(String content, MultipartFile attachment) {
        if (cleanContent(content) == null && (attachment == null || attachment.isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message or attachment is required");
        }
    }

    private String cleanContent(String content) {
        if (content == null) {
            return null;
        }
        String trimmed = content.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private ChatAttachment storeAttachment(MultipartFile attachment) {
        if (attachment == null || attachment.isEmpty()) {
            return null;
        }

        String originalFilename = StringUtils.cleanPath(attachment.getOriginalFilename() != null
                ? attachment.getOriginalFilename()
                : "attachment");
        String kind = resolveAttachmentKind(attachment.getContentType(), originalFilename);
        String extension = extractExtension(originalFilename);
        String storedFilename = UUID.randomUUID() + extension;
        Path folder = Paths.get(uploadDir, "chat-messages").toAbsolutePath().normalize();

        try {
            Files.createDirectories(folder);
            attachment.transferTo(folder.resolve(storedFilename));
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save attachment", ex);
        }

        return new ChatAttachment(
                "/uploads/chat-messages/" + storedFilename,
                originalFilename,
                attachment.getContentType(),
                kind,
                attachment.getSize()
        );
    }

    private void deleteAttachmentFile(String attachmentUrl) {
        if (attachmentUrl == null || attachmentUrl.isBlank()) {
            return;
        }
        String prefix = "/uploads/chat-messages/";
        if (!attachmentUrl.startsWith(prefix)) {
            return;
        }

        Path target = Paths.get(uploadDir, "chat-messages", attachmentUrl.substring(prefix.length()))
                .toAbsolutePath()
                .normalize();

        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // Ignore cleanup failures.
        }
    }

    private String resolveAttachmentKind(String contentType, String filename) {
        String normalizedType = contentType != null ? contentType.toLowerCase(Locale.ROOT) : "";
        String normalizedName = filename != null ? filename.toLowerCase(Locale.ROOT) : "";

        if (normalizedType.startsWith("image/") || hasExtension(normalizedName, ".png", ".jpg", ".jpeg", ".gif", ".webp")) {
            return "IMAGE";
        }
        if (normalizedType.startsWith("video/") || hasExtension(normalizedName, ".mp4", ".mov", ".avi", ".webm", ".mkv")) {
            return "VIDEO";
        }
        if ("application/pdf".equals(normalizedType) || normalizedName.endsWith(".pdf")) {
            return "PDF";
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image, video, or PDF files are allowed");
    }

    private boolean hasExtension(String filename, String... extensions) {
        for (String extension : extensions) {
            if (filename.endsWith(extension)) {
                return true;
            }
        }
        return false;
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex) : "";
    }

    private ChatContactDto toContact(User user) {
        return new ChatContactDto(
                user.getUserId(),
                user.getFirstname(),
                user.getLastName(),
                displayName(user),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole() != null ? user.getRole().name().replace("ROLE_", "") : "USER",
                user.getImageUrl()
        );
    }

    private String normalizeSearchQuery(String searchQuery) {
        if (searchQuery == null) {
            return null;
        }
        String trimmed = searchQuery.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String displayName(User user) {
        return (user.getFirstname() + " " + user.getLastName()).trim();
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && ROLE_ADMIN.equals(user.getRole().name());
    }

    private void ensureRegularUser(User user) {
        if (isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admins do not create support chats");
        }
    }

    private record ChatAttachment(
            String url,
            String name,
            String contentType,
            String kind,
            Long size
    ) {
    }
}

