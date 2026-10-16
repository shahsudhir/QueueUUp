package com.queueup.backend;

// What a customer sends to join: { "name": "Sita", "phone": "", "service": "Haircut" }
public record JoinRequest(String name, String phone, String service) {}
