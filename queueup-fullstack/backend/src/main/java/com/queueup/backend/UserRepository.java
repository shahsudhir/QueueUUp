package com.queueup.backend;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Staff management: only accounts in one shop
    List<User> findByShop(Shop shop);

    // Finds user #id only if they belong to this shop (other shops' users "don't exist")
    Optional<User> findByIdAndShop(Long id, Shop shop);
}
