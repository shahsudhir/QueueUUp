package com.queueup.backend.dto;

import com.queueup.backend.Shop;

// Public information about a shop (safe to show customers)
public record ShopResponse(String name, String address, String slug) {

    public static ShopResponse from(Shop shop) {
        return new ShopResponse(shop.getName(), shop.getAddress(), shop.getSlug());
    }
}
