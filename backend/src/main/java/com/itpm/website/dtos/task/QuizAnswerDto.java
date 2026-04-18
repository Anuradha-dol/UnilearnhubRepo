package com.itpm.website.dtos.task;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerDto {
    private Long questionId;
    private Integer selectedOption;
}
