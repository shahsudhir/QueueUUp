package com.queueup.backend.controller;

import com.queueup.backend.JoinRequest;
import com.queueup.backend.JoinResponse;
import com.queueup.backend.QueueResponse;
import com.queueup.backend.QueueService;
import com.queueup.backend.Shop;
import com.queueup.backend.dto.ShopResponse;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

// Used by customers (no login). The shop comes from the slug in the QR link.
@RestController
@RequestMapping("/api/public/shops/{slug}")
public class PublicQueueController {

    private static final int JOIN_ATTEMPTS = 3;

    private final QueueService queueService;

    public PublicQueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    // GET /api/public/shops/abc-barber : shop name and address for the customer pages
    @GetMapping
    public ShopResponse getShop(@PathVariable String slug) {
        return ShopResponse.from(queueService.findShop(slug));
    }

    // GET /api/public/shops/abc-barber/queue : the live queue (polled every 5 seconds)
    @GetMapping("/queue")
    public QueueResponse getQueue(@PathVariable String slug) {
        return queueService.getQueue(queueService.findShop(slug));
    }

    // POST /api/public/shops/abc-barber/queue : join this shop's queue.
    // Two people joining in the same instant can compute the same token; the database's unique
    // (shop_id, token) constraint refuses the second insert. Each attempt is its own transaction,
    // so retrying simply takes the next free number.
    @PostMapping("/queue")
    @ResponseStatus(HttpStatus.CREATED)
    public JoinResponse join(@PathVariable String slug, @RequestBody JoinRequest request) {
        Shop shop = queueService.findShop(slug);
        for (int attempt = 1; ; attempt++) {
            try {
                return queueService.join(shop, request);
            } catch (DataIntegrityViolationException e) {
                if (attempt >= JOIN_ATTEMPTS) throw e;   // GlobalExceptionHandler -> 409
            }
        }
    }

    // DELETE /api/public/shops/abc-barber/queue/47 with header X-Ticket-Key : a customer leaves
    @DeleteMapping("/queue/{token}")
    public QueueResponse leave(@PathVariable String slug,
                               @PathVariable String token,
                               @RequestHeader(value = "X-Ticket-Key", required = false) String ticketKey) {
        return queueService.leave(queueService.findShop(slug), token, ticketKey);
    }
}
