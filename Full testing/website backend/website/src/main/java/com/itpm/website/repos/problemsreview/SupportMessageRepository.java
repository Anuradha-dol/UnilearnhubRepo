package com.itpm.website.repos.problemsreview;

import com.itpm.website.enities.problemsreview.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    Optional<SupportMessage> findByIdAndSupportQuestionId(Long id, Long supportQuestionId);
}
