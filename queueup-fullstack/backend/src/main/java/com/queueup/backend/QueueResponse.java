package com.queueup.backend;

import java.util.List;

// The queue as React expects it: { "nextToken": 48, "customers": [ ... ] }
public record QueueResponse(int nextToken, List<Customer> customers) {}
