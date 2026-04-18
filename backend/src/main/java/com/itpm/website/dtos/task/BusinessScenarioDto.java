package com.itpm.website.dtos.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessScenarioDto {
    private Long scenarioId;
    private String title;
    private String prompt;

    @Builder.Default
    private List<BusinessChoiceDto> options = new ArrayList<>();
}
