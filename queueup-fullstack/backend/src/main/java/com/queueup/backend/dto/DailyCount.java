package com.queueup.backend.dto;

// One row of the history table: { "date": "2026-10-03", "count": 12 }
public record DailyCount(String date, long count) {}
