package com.queueup.backend.dto;

// Sent after login and shop sign-up
public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private String email;
    private String role;
    private String shopName;
    private String shopSlug;

    public AuthResponse() {}

    public AuthResponse(String token, String email, String role, String shopName, String shopSlug) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.shopName = shopName;
        this.shopSlug = shopSlug;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }

    public String getShopSlug() { return shopSlug; }
    public void setShopSlug(String shopSlug) { this.shopSlug = shopSlug; }
}
