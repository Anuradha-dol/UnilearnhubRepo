package com.itpm.website.enities.problemsreview;

import jakarta.persistence.*;

@Entity
@Table(name = "concepts")
public class Concept {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String topic;
    @Column(columnDefinition = "TEXT")
    private String description;

    public Concept() {}
    public Concept(String topic, String description) {
        this.topic = topic;
        this.description = description;
    }

    public Long getId() { return id; }
    public String getTopic() { return topic; }
    public String getDescription() { return description; }
}
