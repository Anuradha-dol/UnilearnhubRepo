package com.itpm.website.dtos.problemsreview;

import java.util.List;

public record ChatBootstrapDto(
        ChatContactDto currentUser,
        List<ChatConversationDto> supportConversations,
        List<ChatConversationDto> directConversations,
        List<ChatContactDto> contacts,
        List<ChatContactDto> adminContacts
) {
}
