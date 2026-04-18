package com.itpm.website.dtos.learning;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestionResultDTO {
    private Long questionId;
    private String question;
    private String userAnswer;
    private String correctAnswer;
    private boolean correct;
}
