package com.queueup.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final String frontendUrl;
    private final long expiryMinutes;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                MailService mailService,
                                @Value("${app.frontend-url}") String frontendUrl,
                                @Value("${app.password-reset.expiry-minutes:30}") long expiryMinutes) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.frontendUrl = frontendUrl;
        this.expiryMinutes = expiryMinutes;
    }

    // Step 1: "Forgot password". Unknown emails get exactly the same (silent) treatment,
    // so nobody can use this form to discover which emails have accounts.
    @Transactional
    public void requestReset(String email) {
        userRepository.findByEmail(email.trim()).ifPresent(user -> {
            tokenRepository.deleteAllForUser(user);                 // only the newest link works

            String token = newToken();                              // goes in the email
            long expiresAt = System.currentTimeMillis() + expiryMinutes * 60_000;
            tokenRepository.save(new PasswordResetToken(user, sha256(token), expiresAt));   // only the hash is stored

            String link = frontendUrl + "/reset-password?token=" + token;
            mailService.send(user.getEmail(), "Reset your QueueUp password",
                    "Someone asked to reset the password for your QueueUp account at "
                            + user.getShop().getName() + ".\n\n"
                            + "Open this link to choose a new password (valid for " + expiryMinutes + " minutes):\n"
                            + link + "\n\n"
                            + "If it wasn't you, ignore this email; your password stays the same.");
        });
    }

    // Step 2: the link was opened and a new password chosen.
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken reset = tokenRepository.findByTokenHash(sha256(token))
                .filter(t -> t.getUsedAt() == null)
                .filter(t -> t.getExpiresAt() > System.currentTimeMillis())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "This reset link is invalid or has expired. Please request a new one."));

        User user = reset.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.revokeTokens();   // anyone signed in with the old password is signed out
        userRepository.save(user);

        reset.setUsedAt(System.currentTimeMillis());               // single use
        tokenRepository.save(reset);
    }

    // 32 random bytes from a cryptographically secure generator, URL-safe
    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
