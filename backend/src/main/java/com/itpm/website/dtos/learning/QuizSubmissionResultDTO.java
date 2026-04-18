package com.itpm.website.dtos.learning;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSubmissionResultDTO {
    private Long videoId;
    private String quizSet;
    private Integer score;
    private Integer total;
    private List<QuizQuestionResultDTO> details;
}
