package com.queueup.backend;

// After joining: the updated queue, the new customer, and the secret ticket key.
// The key is sent ONLY in this response, to the person who joined; the phone keeps it to be able to leave.
public record JoinResponse(QueueResponse queue, Customer customer, String ticketKey) {}
