package com.itpm.website.enities.learning;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "quiz_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long videoId; // Foreign key to VideoResource

    @Column(name = "quiz_set")
    private String quizSet;

    private String question;

    @ElementCollection
    private List<String> options; // list of choices

    private String correctAnswer; // store correct answer
}

