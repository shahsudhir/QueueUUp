package com.queueup.backend;

// One row of the "served per staff member" query (a Spring Data interface projection).
// Each getter matches an alias in the JPQL query: "as userId", "as servedToday", ...
public interface StaffServedRow {
    Long getUserId();
    Long getServedToday();
    Long getServedTotal();
}
