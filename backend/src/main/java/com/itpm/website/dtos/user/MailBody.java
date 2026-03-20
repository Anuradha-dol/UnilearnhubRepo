package com.itpm.website.dtos.user;

import lombok.Builder;

@Builder
public record MailBody(String to,String subject, String text ) {
}
