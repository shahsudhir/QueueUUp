package com.queueup.backend.controller;

import com.queueup.backend.QueueResponse;
import com.queueup.backend.QueueService;
import com.queueup.backend.User;
import com.queueup.backend.dto.DailyCount;
import com.queueup.backend.dto.ShopResponse;
import com.queueup.backend.dto.StaffStatsResponse;
import com.queueup.backend.security.CurrentUser;

import java.util.List;

import org.springframework.web.bind.annotation.*;

// Used by signed-in admin/staff. The shop ALWAYS comes from their account, never from the request.
@RestController
@RequestMapping("/api/business")
public class BusinessQueueController {

    private final QueueService queueService;
    private final CurrentUser currentUser;

    public BusinessQueueController(QueueService queueService, CurrentUser currentUser) {
        this.queueService = queueService;
        this.currentUser = currentUser;
    }

    // GET /api/business/shop : my shop's name, address and slug (for the QR page)
    @GetMapping("/shop")
    public ShopResponse myShop() {
        return ShopResponse.from(currentUser.shop());
    }

    // GET /api/business/queue
    @GetMapping("/queue")
    public QueueResponse getQueue() {
        return queueService.getQueue(currentUser.shop());
    }

    // POST /api/business/queue/47/serve : also records WHO served (the signed-in account)
    @PostMapping("/queue/{token}/serve")
    public QueueResponse serve(@PathVariable String token) {
        User me = currentUser.get();
        return queueService.serve(me.getShop(), token, me);
    }

    // POST /api/business/queue/47/skip
    @PostMapping("/queue/{token}/skip")
    public QueueResponse skip(@PathVariable String token) {
        return queueService.skip(currentUser.shop(), token);
    }

    // DELETE /api/business/queue/47 : owner/staff removes someone
    @DeleteMapping("/queue/{token}")
    public QueueResponse remove(@PathVariable String token) {
        return queueService.remove(currentUser.shop(), token);
    }

    // GET /api/business/queue/history : served per day, last 30 days
    @GetMapping("/queue/history")
    public List<DailyCount> history() {
        return queueService.history(currentUser.shop());
    }

    // GET /api/business/stats/staff : served per staff member (ADMIN only, see SecurityConfig)
    @GetMapping("/stats/staff")
    public StaffStatsResponse staffStats() {
        return queueService.staffStats(currentUser.shop());
    }
}
