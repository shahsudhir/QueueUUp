package com.queueup.backend;

import jakarta.persistence.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Entity
@Table(
    name = "customers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"shop_id", "token"})
)
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                 // database row number (MySQL AUTO_INCREMENT)

    // Which shop's queue this customer is in. No getter: keeps the shop out of the JSON.
    @ManyToOne(optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(nullable = false, length = 10)
    private String token;            // unique per shop (see @UniqueConstraint above)

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, length = 40)
    private String service;

    @Column(nullable = false, length = 10)
    private String status;           // waiting, serving, served, removed

    @Column(nullable = false)
    private long joinedAt;

    private Integer positionAtJoin;

    @Column(nullable = false)
    private long queueOrder;         // place in line; skip moves it to the back

    private Long finishedAt;         // when they were served or removed (null while in line)

    // Who pressed "Served" (admin or staff). Null while in line, when removed/left,
    // for customers served before this feature existed, or if that account was deleted.
    // No getter: keeps user details out of the queue JSON.
    @ManyToOne
    @JoinColumn(name = "served_by_id")
    private User servedBy;

    // Secret given only to the person who joined; required to leave (so nobody can remove others)
    @Column(length = 36)
    private String ticketKey;

    // Optimistic locking: an UPDATE only succeeds if nobody changed the row since it was read
    @Version
    private long version;

    protected Customer() {}          // JPA needs an empty constructor

    public Customer(String token, String name, String phone,
                    String service, String status, long joinedAt) {
        this.token = token;
        this.name = name;
        this.phone = phone;
        this.service = service;
        this.status = status;
        this.joinedAt = joinedAt;
    }

    public String getToken() { return token; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getService() { return service; }
    public String getStatus() { return status; }
    public long getJoinedAt() { return joinedAt; }
    public Integer getPositionAtJoin() { return positionAtJoin; }
    public Long getFinishedAt() { return finishedAt; }

    public void setShop(Shop shop) { this.shop = shop; }
    public void setStatus(String status) { this.status = status; }
    public void setPositionAtJoin(Integer positionAtJoin) { this.positionAtJoin = positionAtJoin; }
    public void setQueueOrder(long queueOrder) { this.queueOrder = queueOrder; }
    public void setFinishedAt(Long finishedAt) { this.finishedAt = finishedAt; }
    public void setServedBy(User servedBy) { this.servedBy = servedBy; }
    public void setTicketKey(String ticketKey) { this.ticketKey = ticketKey; }

    // No getter for the key (it must never appear in the public queue JSON); only this check.
    // MessageDigest.isEqual compares in constant time, so timing can't reveal the key.
    public boolean hasTicketKey(String candidate) {
        if (ticketKey == null || candidate == null) return false;
        return MessageDigest.isEqual(ticketKey.getBytes(StandardCharsets.UTF_8), candidate.getBytes(StandardCharsets.UTF_8));
    }
}
