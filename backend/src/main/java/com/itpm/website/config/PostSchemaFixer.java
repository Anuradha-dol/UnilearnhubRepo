package com.itpm.website.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostSchemaFixer {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void dropLegacyUniqueConstraintOnPostsUserId() {
        try {
            List<String> constraints = jdbcTemplate.queryForList(
                    """
                    SELECT tc.constraint_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name
                     AND tc.table_schema = kcu.table_schema
                    WHERE tc.table_name = 'posts'
                      AND tc.table_schema = 'public'
                      AND tc.constraint_type = 'UNIQUE'
                      AND kcu.column_name = 'user_id'
                    """,
                    String.class
            );

            for (String constraintName : constraints) {
                String safeName = constraintName.replace("\"", "\"\"");
                jdbcTemplate.execute("ALTER TABLE posts DROP CONSTRAINT IF EXISTS \"" + safeName + "\"");
                log.info("Dropped legacy unique constraint on posts.user_id: {}", constraintName);
            }
        } catch (RuntimeException ex) {
            log.warn("Post schema fixer skipped: {}", ex.getMessage());
        }
    }
}

