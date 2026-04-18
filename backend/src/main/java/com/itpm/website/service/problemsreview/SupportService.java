package com.itpm.website.service.problemsreview;

import com.itpm.website.enities.problemsreview.SupportQuestion;
import com.itpm.website.repos.problemsreview.SupportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportRepository supportRepository;


    public SupportQuestion createQuestion(SupportQuestion q) {
        return supportRepository.save(q);
    }


    public List<SupportQuestion> getUserQuestions(Long userId) {
        return supportRepository.findByUserId(userId);
    }


    public void deleteQuestion(Long id, Long userId) {
        SupportQuestion q = supportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (!q.getUserId().equals(userId)) throw new RuntimeException("Not allowed");
        supportRepository.delete(q);
    }


    public List<SupportQuestion> getAllQuestions() {
        return supportRepository.findAll();
    }


    public SupportQuestion respondToQuestion(Long id, String response) {
        SupportQuestion q = supportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        q.setAdminResponse(response);
        q.setStatus("ANSWERED");
        return supportRepository.save(q);
    }
}

