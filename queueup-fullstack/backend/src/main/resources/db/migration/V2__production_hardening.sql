-- Ticket keys (only the joiner can leave), optimistic locking, token revocation, hot-path index.

ALTER TABLE customers
    ADD COLUMN ticket_key VARCHAR(36) NULL,
    ADD COLUMN version    BIGINT      NOT NULL DEFAULT 0;

ALTER TABLE users
    ADD COLUMN token_version INT NOT NULL DEFAULT 0;

-- Every queue read: WHERE shop_id = ? AND status IN (...) ORDER BY queue_order
CREATE INDEX idx_customers_shop_status_order ON customers (shop_id, status, queue_order);
