package com.queueup.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// Every night: delete customer records older than app.retention.days (names and phone numbers are
// personal data; keep them only as long as needed), and expired password-reset links.
@Component
public class RetentionJob {

    private static final Logger log = LoggerFactory.getLogger(RetentionJob.class);

    private final CustomerRepository customerRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final long retentionDays;

    public RetentionJob(CustomerRepository customerRepository,
                        PasswordResetTokenRepository resetTokenRepository,
                        @Value("${app.retention.days:90}") long retentionDays) {
        this.customerRepository = customerRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.retentionDays = retentionDays;
    }

    @Scheduled(cron = "0 30 3 * * *", zone = "Asia/Kathmandu")   // 03:30 Nepal time
    @Transactional
    public void cleanUp() {
        long now = System.currentTimeMillis();
        long cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
        int customers = customerRepository.deleteFinishedBefore(cutoff);
        int links = resetTokenRepository.deleteExpired(now);
        log.info("Retention clean-up: removed {} old customers and {} expired reset links", customers, links);
    }
}
