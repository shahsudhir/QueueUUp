package com.queueup.backend;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Every query is limited to ONE shop: no query may ever see across shops.
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // Everyone in line at one shop, in queue order
    List<Customer> findByShopAndStatusInOrderByQueueOrderAsc(Shop shop, Collection<String> statuses);

    // One customer still in line at one shop
    Optional<Customer> findByShopAndTokenAndStatusIn(Shop shop, String token, Collection<String> statuses);

    // The most recent customer at one shop (for the next token number)
    Optional<Customer> findTopByShopOrderByIdDesc(Shop shop);

    // The back of the line at one shop
    @Query("select coalesce(max(c.queueOrder), 0) from Customer c where c.shop = :shop")
    long findMaxQueueOrder(@Param("shop") Shop shop);

    // History: customers with a status (e.g. "served") finished since a time, at one shop
    List<Customer> findByShopAndStatusAndFinishedAtGreaterThanEqual(Shop shop, String status, Long since);

    // Staff performance: how many customers each account served, today and since a date.
    // JOIN c.servedBy follows the @ManyToOne; GROUP BY gives one row per staff member.
    @Query("""
            select u.id as userId,
                   sum(case when c.finishedAt >= :startOfToday then 1 else 0 end) as servedToday,
                   count(c.id) as servedTotal
            from Customer c join c.servedBy u
            where c.shop = :shop
              and c.status = 'served'
              and c.finishedAt >= :since
            group by u.id
            """)
    List<StaffServedRow> countServedByStaff(@Param("shop") Shop shop,
                                            @Param("since") long since,
                                            @Param("startOfToday") long startOfToday);

    // Served customers with no recorded staff member (served before this feature, or account deleted)
    long countByShopAndStatusAndServedByIsNullAndFinishedAtGreaterThanEqual(Shop shop, String status, Long since);

    // Before deleting an account: keep the customers, forget who served them
    @Modifying
    @Query("update Customer c set c.servedBy = null where c.servedBy = :user")
    int clearServedBy(@Param("user") User user);

    // Data retention: delete finished customers (served/removed) older than the cut-off
    @Modifying
    @Query("delete from Customer c where c.finishedAt < :cutoff and c.status in ('served', 'removed')")
    int deleteFinishedBefore(@Param("cutoff") long cutoff);
}
