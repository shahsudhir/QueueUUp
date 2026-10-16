package com.queueup.backend.dto;

// One staff member's numbers: { "userId": 3, "email": "...", "role": "ROLE_STAFF", "servedToday": 7, "servedLast30Days": 120 }
public record StaffStats(Long userId, String email, String role, long servedToday, long servedLast30Days) {}
