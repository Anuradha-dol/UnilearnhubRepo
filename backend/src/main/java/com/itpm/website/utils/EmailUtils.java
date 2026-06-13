package com.itpm.website.utils;

import com.itpm.website.dtos.user.MailBody;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class EmailUtils {


    private final JavaMailSender javaMailSender;
    private final String fromAddress;

    public EmailUtils(JavaMailSender javaMailSender,
                      @Value("${spring.mail.from-address:no-reply@unilearnhub.local}") String fromAddress) {
        this.javaMailSender = javaMailSender;
        this.fromAddress = fromAddress;
    }

    public void sendMail(MailBody mailBody) throws MessagingException {
        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(mailBody.to());
        helper.setFrom(fromAddress);
        helper.setSubject(mailBody.subject());
        helper.setText(mailBody.text(), true); // Set to true for HTML content

        javaMailSender.send(message);
    }


}

