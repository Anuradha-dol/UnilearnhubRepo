package com.itpm.website.dtos.problemsreview;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupportWsMessage {
    private String type;
    private Long id;
    private Long messageId;
    private String message;
    private String question;
    private String response;

    public String resolveText() {
        if (message != null && !message.isBlank()) {
            return message;
        }
        if (question != null && !question.isBlank()) {
            return question;
        }
        if (response != null && !response.isBlank()) {
            return response;
        }
        return "";
    }
}
