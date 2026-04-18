package com.itpm.website.controller.problemsreview;

import com.itpm.website.dtos.problemsreview.ChatBootstrapDto;
import com.itpm.website.dtos.problemsreview.ChatContactDto;
import com.itpm.website.dtos.problemsreview.ChatConversationDto;
import com.itpm.website.dtos.problemsreview.StartDirectConversationDto;
import com.itpm.website.dtos.problemsreview.UpdateChatMessageDto;
import com.itpm.website.enities.User;
import com.itpm.website.enities.problemsreview.ChatConversation;
import com.itpm.website.service.problemsreview.SupportService;
import com.itpm.website.websocket.SupportWebSocketHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;
    private final SupportWebSocketHandler supportWebSocketHandler;

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @GetMapping("/bootstrap")
    public ResponseEntity<ChatBootstrapDto> bootstrap(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(supportService.getBootstrap(user));
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @GetMapping("/contacts")
    public ResponseEntity<List<ChatContactDto>> searchContacts(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "firstname", required = false) String firstname) {

        return ResponseEntity.ok(supportService.searchContacts(user, firstname));
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/support-conversations")
    public ResponseEntity<ChatConversationDto> createSupportConversation(@AuthenticationPrincipal User user) {
        ChatConversation conversation = supportService.createOrGetSupportConversation(user);
        supportWebSocketHandler.broadcastConversationUpdate(conversation);
        return ResponseEntity.ok(supportService.toConversationDto(conversation, user));
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @PostMapping("/direct-conversations")
    public ResponseEntity<ChatConversationDto> createDirectConversation(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody StartDirectConversationDto dto) {

        ChatConversation conversation = supportService.createOrGetDirectConversation(user, dto.recipientId());
        supportWebSocketHandler.broadcastConversationUpdate(conversation);
        return ResponseEntity.ok(supportService.toConversationDto(conversation, user));
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @PostMapping(value = "/conversations/{id}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatConversationDto> sendMessage(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {

        ChatConversation conversation = supportService.sendMessage(id, user, content, attachment);
        supportWebSocketHandler.broadcastConversationUpdate(conversation);
        return ResponseEntity.ok(supportService.toConversationDto(conversation, user));
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @PutMapping("/conversations/{id}/messages/{messageId}")
    public ResponseEntity<ChatConversationDto> updateMessage(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long messageId,
            @Valid @RequestBody UpdateChatMessageDto dto) {

        ChatConversation conversation = supportService.updateMessage(id, messageId, user, dto.content());
        supportWebSocketHandler.broadcastConversationUpdate(conversation);
        return ResponseEntity.ok(supportService.toConversationDto(conversation, user));
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @DeleteMapping("/conversations/{id}/messages/{messageId}")
    public ResponseEntity<ChatConversationDto> deleteMessage(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long messageId) {

        ChatConversation conversation = supportService.deleteMessage(id, messageId, user);
        supportWebSocketHandler.broadcastMessageDeleted(conversation);
        return ResponseEntity.ok(supportService.toConversationDto(conversation, user));
    }
}
