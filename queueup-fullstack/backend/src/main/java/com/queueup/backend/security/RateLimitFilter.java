package com.queueup.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

// Limits how often one IP address may call sensitive endpoints (fixed time windows, in memory).
// Blocks password guessing, fake shop sign-ups, reset-email flooding and queue spam.
// In-memory means per backend instance; with several instances, move counters to Redis (e.g. Bucket4j).
// Not a Spring bean on purpose: SecurityConfig creates it and places it inside the security chain,
// after CORS, so 429 responses still carry CORS headers.
public class RateLimitFilter extends OncePerRequestFilter {

    private record Rule(String name, String method, Pattern path, int limit, long windowMs) {}

    private record Window(long start, int count) {}

    private static final long MINUTE = 60_000, HOUR = 60 * MINUTE;

    private static final List<Rule> RULES = List.of(
            new Rule("login",    "POST", Pattern.compile("^/api/auth/login$"),            10, MINUTE),
            new Rule("signup",   "POST", Pattern.compile("^/api/auth/register-shop$"),     5, HOUR),
            new Rule("forgot",   "POST", Pattern.compile("^/api/auth/forgot-password$"),   5, HOUR),
            new Rule("reset",    "POST", Pattern.compile("^/api/auth/reset-password$"),   10, HOUR),
            new Rule("join",     "POST", Pattern.compile("^/api/public/shops/[^/]+/queue$"), 10, MINUTE)
    );

    private final boolean enabled;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (enabled) {
            String path = request.getRequestURI();
            for (Rule rule : RULES) {
                if (rule.method().equals(request.getMethod()) && rule.path().matcher(path).matches()) {
                    long retryAfterSeconds = consume(rule, request.getRemoteAddr());
                    if (retryAfterSeconds > 0) {
                        reject(response, retryAfterSeconds);
                        return;
                    }
                    break;
                }
            }
        }
        chain.doFilter(request, response);
    }

    // Counts this request. Returns 0 if allowed, otherwise seconds until the window resets.
    private long consume(Rule rule, String ip) {
        long now = System.currentTimeMillis();
        cleanUpIfLarge(now);
        Window window = windows.compute(rule.name() + ":" + ip, (key, old) ->
                (old == null || now - old.start() >= rule.windowMs())
                        ? new Window(now, 1)
                        : new Window(old.start(), old.count() + 1));
        if (window.count() <= rule.limit()) return 0;
        return Math.max(1, (window.start() + rule.windowMs() - now) / 1000);
    }

    // Keep memory bounded: drop windows older than the longest rule
    private void cleanUpIfLarge(long now) {
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(e -> now - e.getValue().start() >= HOUR);
        }
    }

    private void reject(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\","
                + "\"message\":\"Too many attempts. Please wait a few minutes and try again.\"}");
    }
}
