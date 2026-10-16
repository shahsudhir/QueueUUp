package com.queueup.backend;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopRepository extends JpaRepository<Shop, Long> {

    Optional<Shop> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
