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
public class LearnerQuizQuestionDTO {
    private Long id;
    private String question;
    private List<String> options;
}
