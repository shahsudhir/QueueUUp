package com.queueup.backend;

import com.queueup.backend.dto.DailyCount;
import com.queueup.backend.dto.StaffStats;
import com.queueup.backend.dto.StaffStatsResponse;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

// The queue rules. Every method works inside ONE shop, chosen by the controller.
@Service
public class QueueService {

    private static final Logger log = LoggerFactory.getLogger(QueueService.class);
    private static final List<String> IN_LINE = List.of("waiting", "serving");
    private static final ZoneId SHOP_ZONE = ZoneId.of("Asia/Kathmandu");   // which "day" a serve counts on
    private static final long HISTORY_DAYS = 30;

    private final CustomerRepository repository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    public QueueService(CustomerRepository repository, ShopRepository shopRepository, UserRepository userRepository) {
        this.repository = repository;
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
    }

    // ---------- Finding a shop (customers arrive with a slug from the QR link) ----------

    @Transactional(readOnly = true)
    public Shop findShop(String slug) {
        return shopRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shop not found."));
    }

    // ---------- The queue of one shop ----------

    @Transactional(readOnly = true)
    public QueueResponse getQueue(Shop shop) {
        List<Customer> inLine = repository.findByShopAndStatusInOrderByQueueOrderAsc(shop, IN_LINE);
        return new QueueResponse(nextToken(shop), inLine);
    }

    @Transactional
    public JoinResponse join(Shop shop, JoinRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name needs at least 2 characters.");
        }
        if (name.length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name can be at most 50 characters.");
        }
        String phone = request.phone() == null ? "" : request.phone().trim();
        String service = request.service() == null ? "Haircut" : request.service();

        int peopleInLine = repository.findByShopAndStatusInOrderByQueueOrderAsc(shop, IN_LINE).size();

        Customer customer = new Customer(
                String.valueOf(nextToken(shop)), name, phone, service, "waiting", System.currentTimeMillis());
        customer.setShop(shop);
        customer.setPositionAtJoin(peopleInLine);
        customer.setQueueOrder(repository.findMaxQueueOrder(shop) + 1);   // back of this shop's line
        String ticketKey = UUID.randomUUID().toString();                 // random, unguessable
        customer.setTicketKey(ticketKey);

        repository.save(customer);                                       // INSERT
        promoteNext(shop);

        log.info("Shop '{}': token #{} joined, status '{}'", shop.getSlug(), customer.getToken(), customer.getStatus());
        return new JoinResponse(getQueue(shop), customer, ticketKey);
    }

    // Barber pressed "Served": keep the row as history, remember WHO served, take them out of line.
    @Transactional
    public QueueResponse serve(Shop shop, String token, User servedBy) {
        Customer customer = findInLine(shop, token);
        customer.setStatus("served");
        customer.setFinishedAt(System.currentTimeMillis());
        customer.setServedBy(servedBy);
        repository.save(customer);                                       // UPDATE
        promoteNext(shop);
        return getQueue(shop);
    }

    // Owner or staff removed someone (business endpoint, already authorised by role and shop).
    @Transactional
    public QueueResponse remove(Shop shop, String token) {
        markRemoved(shop, findInLine(shop, token));
        return getQueue(shop);
    }

    // A customer leaves their own ticket. Only the phone holding the ticket key may do this.
    @Transactional
    public QueueResponse leave(Shop shop, String token, String ticketKey) {
        Customer customer = findInLine(shop, token);
        if (!customer.hasTicketKey(ticketKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This ticket belongs to someone else.");
        }
        markRemoved(shop, customer);
        return getQueue(shop);
    }

    private void markRemoved(Shop shop, Customer customer) {
        customer.setStatus("removed");
        customer.setFinishedAt(System.currentTimeMillis());
        repository.save(customer);
        promoteNext(shop);
    }

    // Skip: back to waiting, and move to the back of the line.
    @Transactional
    public QueueResponse skip(Shop shop, String token) {
        Customer customer = findInLine(shop, token);
        customer.setStatus("waiting");
        customer.setQueueOrder(repository.findMaxQueueOrder(shop) + 1);
        repository.save(customer);
        promoteNext(shop);
        return getQueue(shop);
    }

    // ---------- History: customers served per day, last 30 days, newest first ----------

    @Transactional(readOnly = true)
    public List<DailyCount> history(Shop shop) {
        long since = System.currentTimeMillis() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
        List<Customer> served = repository.findByShopAndStatusAndFinishedAtGreaterThanEqual(shop, "served", since);

        Map<LocalDate, Long> perDay = served.stream().collect(Collectors.groupingBy(
                c -> Instant.ofEpochMilli(c.getFinishedAt()).atZone(SHOP_ZONE).toLocalDate(),
                TreeMap::new,
                Collectors.counting()
        ));

        return perDay.entrySet().stream()
                .sorted(Map.Entry.<LocalDate, Long>comparingByKey().reversed())
                .map(e -> new DailyCount(e.getKey().toString(), e.getValue()))
                .toList();
    }

    // ---------- Staff performance: served today and in the last 30 days, per account ----------

    @Transactional(readOnly = true)
    public StaffStatsResponse staffStats(Shop shop) {
        ZonedDateTime now = ZonedDateTime.now(SHOP_ZONE);
        long startOfToday = now.toLocalDate().atStartOfDay(SHOP_ZONE).toInstant().toEpochMilli();
        long since = now.minusDays(HISTORY_DAYS).toInstant().toEpochMilli();

        // 1. Counts per account that served at least one customer (one GROUP BY query)
        Map<Long, StaffServedRow> counts = repository.countServedByStaff(shop, since, startOfToday).stream()
                .collect(Collectors.toMap(StaffServedRow::getUserId, row -> row));

        // 2. Every account of the shop, so people with 0 served still appear
        List<StaffStats> staff = userRepository.findByShop(shop).stream()
                .map(user -> {
                    StaffServedRow row = counts.get(user.getId());
                    long today = row == null ? 0 : row.getServedToday();
                    long total = row == null ? 0 : row.getServedTotal();
                    return new StaffStats(user.getId(), user.getEmail(), user.getRole(), today, total);
                })
                .sorted(Comparator.comparingLong(StaffStats::servedToday).reversed()
                        .thenComparing(StaffStats::email))
                .toList();

        // 3. Served customers with no recorded staff member
        long unassignedToday = repository.countByShopAndStatusAndServedByIsNullAndFinishedAtGreaterThanEqual(shop, "served", startOfToday);
        long unassignedTotal = repository.countByShopAndStatusAndServedByIsNullAndFinishedAtGreaterThanEqual(shop, "served", since);

        return new StaffStatsResponse(staff, unassignedToday, unassignedTotal);
    }

    // ---------- Helpers (always scoped to one shop) ----------

    private Customer findInLine(Shop shop, String token) {
        return repository.findByShopAndTokenAndStatusIn(shop, token, IN_LINE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Token #" + token + " is no longer in the queue."));
    }

    // If nobody is in the chair, the first waiting customer becomes "serving".
    private void promoteNext(Shop shop) {
        List<Customer> inLine = repository.findByShopAndStatusInOrderByQueueOrderAsc(shop, IN_LINE);
        boolean someoneServing = inLine.stream().anyMatch(c -> "serving".equals(c.getStatus()));
        if (someoneServing) return;

        inLine.stream()
                .filter(c -> "waiting".equals(c.getStatus()))
                .findFirst()
                .ifPresent(c -> {
                    c.setStatus("serving");
                    repository.save(c);
                });
    }

    // Next token = this shop's latest token + 1 (or 1 for a brand-new shop).
    private int nextToken(Shop shop) {
        return repository.findTopByShopOrderByIdDesc(shop)
                .map(c -> Integer.parseInt(c.getToken()) + 1)
                .orElse(1);
    }
}
