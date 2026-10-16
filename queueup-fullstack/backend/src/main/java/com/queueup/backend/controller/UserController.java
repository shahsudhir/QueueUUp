package com.queueup.backend.controller;

import com.queueup.backend.CustomerRepository;
import com.queueup.backend.PasswordResetTokenRepository;
import com.queueup.backend.User;
import com.queueup.backend.UserRepository;
import com.queueup.backend.dto.CreateUserRequest;
import com.queueup.backend.dto.ResetPasswordRequest;
import com.queueup.backend.dto.UserResponse;
import com.queueup.backend.security.CurrentUser;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

// Admin only (see SecurityConfig). Every action is limited to the admin's OWN shop.
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Set<String> ALLOWED_ROLES = Set.of("ROLE_ADMIN", "ROLE_STAFF");

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUser currentUser;

    public UserController(UserRepository userRepository, CustomerRepository customerRepository,
                          PasswordResetTokenRepository resetTokenRepository,
                          PasswordEncoder passwordEncoder, CurrentUser currentUser) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUser = currentUser;
    }

    // GET /api/users : accounts in MY shop only (no passwords)
    @GetMapping
    public List<UserResponse> listUsers() {
        return userRepository.findByShop(currentUser.shop()).stream()
                .map(UserResponse::from)
                .toList();
    }

    // POST /api/users : add a staff or admin account to MY shop
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        String email = request.email().trim();

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email is already registered."));
        }

        String role = normalizeRole(request.role());
        if (!ALLOWED_ROLES.contains(role)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Role must be STAFF or ADMIN."));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setShop(currentUser.shop());          // always the admin's own shop
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    // PUT /api/users/{id}/password : reset a password, only for someone in MY shop
    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        User me = currentUser.get();
        User user = userRepository.findByIdAndShop(id, me.getShop()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found."));
        }
        if (user.getId().equals(me.getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Use Change password for your own account."));
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.revokeTokens();   // signs this staff member out on every device
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset for " + user.getEmail() + "."));
    }

    // DELETE /api/users/{id} : remove an account, only from MY shop.
    // @Transactional: "forget who served" and "delete the account" happen together.
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User me = currentUser.get();
        User user = userRepository.findByIdAndShop(id, me.getShop()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found."));
        }
        if (user.getId().equals(me.getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "You can't remove your own account."));
        }

        // Customers they served keep their history; only the link to this account is cleared.
        // Without this, MySQL would refuse the delete (customers.served_by_id points at this user).
        customerRepository.clearServedBy(user);
        resetTokenRepository.deleteAllForUser(user);   // reset links point at this account too
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", user.getEmail() + " was removed."));
    }

    // "staff" -> "ROLE_STAFF", "ADMIN" -> "ROLE_ADMIN", empty -> "ROLE_STAFF"
    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) return "ROLE_STAFF";
        String upper = role.trim().toUpperCase();
        return upper.startsWith("ROLE_") ? upper : "ROLE_" + upper;
    }
}
