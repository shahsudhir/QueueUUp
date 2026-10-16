package com.queueup.backend.controller;

import com.queueup.backend.PasswordResetService;
import com.queueup.backend.ShopService;
import com.queueup.backend.User;
import com.queueup.backend.UserRepository;
import com.queueup.backend.dto.AuthResponse;
import com.queueup.backend.dto.ChangePasswordRequest;
import com.queueup.backend.dto.ForgotPasswordRequest;
import com.queueup.backend.dto.LoginRequest;
import com.queueup.backend.dto.RegisterShopRequest;
import com.queueup.backend.dto.ResetPasswordWithTokenRequest;
import com.queueup.backend.security.JwtService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final ShopService shopService;
    private final PasswordResetService passwordResetService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            ShopService shopService,
            PasswordResetService passwordResetService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.shopService = shopService;
        this.passwordResetService = passwordResetService;
    }

    // POST /api/auth/register-shop : anyone can create a shop and becomes its admin
    @PostMapping("/register-shop")
    public ResponseEntity<?> registerShop(@Valid @RequestBody RegisterShopRequest request) {
        if (userRepository.existsByEmail(request.email().trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email is already registered."));
        }

        User admin = shopService.registerShop(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toAuthResponse(admin));
    }

    // POST /api/auth/login : admin or staff
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            // Same message for a wrong email and a wrong password, so attackers can't discover accounts
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(toAuthResponse(user));
    }

    // POST /api/auth/change-password : the signed-in user changes their own password
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication
    ) {
        // Who is asking? From the token (via JwtAuthenticationFilter), never from the body
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Current password is incorrect."));
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "New password must be different from the current one."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.revokeTokens();   // every existing login (this one included) stops working
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed. Please sign in again with your new password."));
    }

    // POST /api/auth/forgot-password : always the same answer, whether or not the email exists
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.email());
        return ResponseEntity.ok(Map.of("message",
                "If that email has a QueueUp account, we've sent a link to reset the password."));
    }

    // POST /api/auth/reset-password : set a new password with the token from the emailed link
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordWithTokenRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Your password has been reset. You can sign in now."));
    }

    // Token + the user's role and shop, sent after sign-up and login
    private AuthResponse toAuthResponse(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole(), user.getTokenVersion());
        return new AuthResponse(
                token,
                user.getEmail(),
                user.getRole(),
                user.getShop().getName(),
                user.getShop().getSlug()
        );
    }
}
