package com.queueup.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

// Sends emails when spring.mail.* is configured. Otherwise (local development)
// it prints the message in the backend terminal, so features still work without SMTP.
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;   // "maybe a bean": absent without spring.mail.host
    private final String from;

    public MailService(ObjectProvider<JavaMailSender> mailSender, @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void send(String to, String subject, String text) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.warn("Email is not configured; printing instead.\n----- To: {} -----\nSubject: {}\n{}\n-----", to, subject, text);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        try {
            sender.send(message);
        } catch (RuntimeException e) {
            // Don't reveal mail problems to the caller (or whether the account exists); alert via logs
            log.error("Could not send email to {}: {}", to, e.getMessage());
        }
    }
}
