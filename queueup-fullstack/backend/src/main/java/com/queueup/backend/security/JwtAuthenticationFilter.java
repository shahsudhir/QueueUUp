package com.queueup.backend.security;

import com.queueup.backend.User;
import com.queueup.backend.UserRepository;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// Runs once per request: reads the token and records WHO is making the request.
// It never rejects anything itself; SecurityConfig's rules decide what's allowed.
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // 1. No token: continue as an anonymous visitor
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            // 2. Read the email (also verifies signature and expiry)
            String email = jwtService.extractUsername(jwt);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 3. The account must still exist, and the token must carry its current version
                //    (a password change or reset makes every older token invalid)
                User user = userRepository.findByEmail(email).orElse(null);

                if (user != null && jwtService.isTokenValid(jwt, user.getEmail(), user.getTokenVersion())) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            user.getEmail(), null, List.of(new SimpleGrantedAuthority(user.getRole())));
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 4. Record who this request belongs to
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (JwtException | IllegalArgumentException e) {
            // Expired, tampered or malformed token: treat the request as anonymous
            log.debug("Ignoring invalid JWT: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        // 5. Always continue; the rules in SecurityConfig make the final decision
        filterChain.doFilter(request, response);
    }
}
