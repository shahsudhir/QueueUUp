package com.queueup.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// "Create your shop" form: the shop + its first admin account (no role field: always ADMIN)
public record RegisterShopRequest(
        @NotBlank(message = "Shop name is required")
        @Size(max = 80, message = "Shop name can be at most 80 characters")
        String shopName,

        @Size(max = 150, message = "Address can be at most 150 characters")
        String address,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters long")
        String password
) {}
