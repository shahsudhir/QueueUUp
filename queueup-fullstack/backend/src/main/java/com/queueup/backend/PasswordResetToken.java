package com.queueup.backend;

import jakarta.persistence.*;

// One "forgot password" request. Only a HASH of the token is stored, like a password:
// if the database leaked, the stored values couldn't be used as reset links.
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // SHA-256 of the token in the emailed link, as 64 hex characters
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private long expiresAt;

    private Long usedAt;   // set once the link has been used (single use)

    protected PasswordResetToken() {}

    public PasswordResetToken(User user, String tokenHash, long expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    public User getUser() { return user; }
    public long getExpiresAt() { return expiresAt; }
    public Long getUsedAt() { return usedAt; }

    public void setUsedAt(Long usedAt) { this.usedAt = usedAt; }
}
