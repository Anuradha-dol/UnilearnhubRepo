package com.itpm.website.service.user;

import com.itpm.website.dtos.user.MailBody;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService{


    private final JavaMailSender javaMailSender;
    private final String fromAddress;


    public EmailService(JavaMailSender javaMailSender,
                        @Value("${spring.mail.from-address:no-reply@unilearnhub.local}") String fromAddress) {
        this.javaMailSender = javaMailSender;
        this.fromAddress = fromAddress;
    }

    public  void sendSimpleMessasge(MailBody mailBody){


        SimpleMailMessage message= new SimpleMailMessage();
        message.setTo(mailBody.to());
        message.setFrom(fromAddress);
        message.setSubject(mailBody.subject());
        message.setText(mailBody.text());


        javaMailSender.send(message);
    }
}
