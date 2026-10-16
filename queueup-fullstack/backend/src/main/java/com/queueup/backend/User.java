package com.queueup.backend;

import jakarta.persistence.*;

// A shop account: the owner (ROLE_ADMIN) or a staff member (ROLE_STAFF).
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Emails are unique across ALL shops, because login only asks for email + password
    @Column(nullable = false, unique = true, length = 120)
    private String email;

    // BCrypt hash, never the real password
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 20)
    private String role;   // ROLE_ADMIN or ROLE_STAFF

    // Which shop this account belongs to (loaded together with the user)
    @ManyToOne(optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    // Part of every JWT. Increasing it signs this account out everywhere
    // (after a password change or reset): older tokens carry the old number.
    @Column(nullable = false)
    private int tokenVersion;

    public User() {}

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getRole() { return role; }
    public Shop getShop() { return shop; }
    public int getTokenVersion() { return tokenVersion; }

    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setRole(String role) { this.role = role; }
    public void setShop(Shop shop) { this.shop = shop; }
    public void revokeTokens() { this.tokenVersion++; }
}
