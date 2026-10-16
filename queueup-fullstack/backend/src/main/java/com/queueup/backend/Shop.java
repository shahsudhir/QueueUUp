package com.queueup.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "shops")
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 150)
    private String address;

    // Short URL-friendly name used in the QR link: /s/abc-barber. Never changes.
    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    @Column(nullable = false)
    private long createdAt;

    protected Shop() {}   // JPA needs an empty constructor

    public Shop(String name, String address, String slug) {
        this.name = name;
        this.address = address;
        this.slug = slug;
        this.createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getSlug() { return slug; }
    public long getCreatedAt() { return createdAt; }

    public void setName(String name) { this.name = name; }
    public void setAddress(String address) { this.address = address; }
}
