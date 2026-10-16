package com.queueup.backend.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final List<String> allowedOrigins;
    private final boolean rateLimitEnabled;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder,
            @Value("${app.cors.allowed-origins}") String allowedOrigins,
            @Value("${app.rate-limit.enabled:true}") boolean rateLimitEnabled
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList();
        this.rateLimitEnabled = rateLimitEnabled;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        // Checks passwords at login: loads the user (UserDetailsService) and compares hashes (PasswordEncoder)
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)            // tokens travel in headers, not cookies
            .cors(Customizer.withDefaults())                  // uses corsConfigurationSource() below
            .authorizeHttpRequests(auth -> auth
                // 1. Browser preflight checks, Spring's error page, health check for the host
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()

                // 2. Accounts: anyone can create a shop, log in or reset a forgotten password;
                //    changing a password while signed in needs a login
                .requestMatchers(HttpMethod.POST, "/api/auth/register-shop", "/api/auth/login",
                        "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/change-password").authenticated()

                // 3. Public test endpoint
                .requestMatchers("/api/hello").permitAll()

                // 4. Customers (no login): a shop's info and queue, by slug
                .requestMatchers("/api/public/**").permitAll()

                // 5. Admin only: staff performance (must come BEFORE the general /api/business/** rule)
                .requestMatchers("/api/business/stats/**").hasAuthority("ROLE_ADMIN")

                // 6. Admin and staff: their own shop's queue, history and info
                .requestMatchers("/api/business/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_STAFF")

                // 7. Admin only: managing accounts in their own shop
                .requestMatchers("/api/users/**").hasAuthority("ROLE_ADMIN")

                // 8. Everything else needs a valid login
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Not signed in -> 401 (signed in but not allowed stays 403)
            .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            // Basic security headers on every response
            .headers(headers -> headers
                .contentTypeOptions(Customizer.withDefaults())
                .frameOptions(frame -> frame.deny()))
            .authenticationProvider(authenticationProvider())
            // Order: CORS -> rate limit -> JWT -> ... (both inserted before the username/password filter)
            .addFilterBefore(new RateLimitFilter(rateLimitEnabled), UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // One CORS setup for the whole backend (origins come from app.cors.allowed-origins / CORS_ORIGINS)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Ticket-Key"));
        config.setMaxAge(3600L);   // browsers may cache the preflight answer for an hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
