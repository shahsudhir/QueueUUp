package com.queueup.backend;

import com.queueup.backend.dto.RegisterShopRequest;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class ShopService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ShopService(ShopRepository shopRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Creates the shop AND its first admin together: both or neither.
    @Transactional
    public User registerShop(RegisterShopRequest request) {
        String address = request.address() == null ? "" : request.address().trim();
        Shop shop = new Shop(request.shopName().trim(), address, uniqueSlug(request.shopName()));
        shopRepository.save(shop);

        User admin = new User();
        admin.setEmail(request.email().trim());
        admin.setPassword(passwordEncoder.encode(request.password()));
        admin.setRole("ROLE_ADMIN");
        admin.setShop(shop);
        userRepository.save(admin);

        return admin;
    }

    // "ABC Barber & Spa!" -> "abc-barber-spa"; if taken: "abc-barber-spa-2", "-3", ...
    private String uniqueSlug(String shopName) {
        String base = shopName.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")   // anything that isn't a-z or 0-9 becomes "-"
                .replaceAll("(^-|-$)", "");      // no "-" at the start or end
        if (base.isBlank()) base = "shop";        // e.g. a name written only in Devanagari
        if (base.length() > 40) base = base.substring(0, 40).replaceAll("-$", "");

        String slug = base;
        int n = 2;
        while (shopRepository.existsBySlug(slug)) {
            slug = base + "-" + n++;
        }
        return slug;
    }
}
