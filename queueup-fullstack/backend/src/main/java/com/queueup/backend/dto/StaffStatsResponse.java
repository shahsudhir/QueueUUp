package com.queueup.backend.dto;

import java.util.List;

// The whole staff-performance card: one row per account + served customers with no recorded staff member
public record StaffStatsResponse(List<StaffStats> staff, long unassignedToday, long unassignedLast30Days) {}
