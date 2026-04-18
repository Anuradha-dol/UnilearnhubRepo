package com.itpm.website.dtos.post;

import com.itpm.website.dtos.user.Interest;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long notificationId;
    private String message;
    private Long postId;
    private Interest learningPreference;
    private String authorName;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
