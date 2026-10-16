package com.queueup.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

// Creates and reads JWTs. The secret comes from app.jwt.secret (JWT_SECRET), never from the code.
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs
    ) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) must be at least 32 characters long");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // Claims: sub = email, role, ver = the account's token version, iat, exp
    public String generateToken(String username, String role, int tokenVersion) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(Map.of("role", role, "ver", tokenVersion))
                .subject(username)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    // The email inside the token. Throws a JwtException if the token is expired or tampered with.
    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    // Valid = right person, not expired, and issued since the last password change/reset
    public boolean isTokenValid(String token, String userEmail, int currentTokenVersion) {
        Claims claims = parse(token);
        Integer version = claims.get("ver", Integer.class);
        return userEmail.equals(claims.getSubject())
                && claims.getExpiration().after(new Date())
                && version != null && version == currentTokenVersion;
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
