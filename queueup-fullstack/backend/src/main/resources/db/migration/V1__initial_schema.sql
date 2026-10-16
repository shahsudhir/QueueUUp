-- QueueUp schema as built up to the multi-shop + staff performance + forgot password versions.
-- On an existing database created by Hibernate, Flyway marks this as already applied (baseline).

CREATE TABLE shops (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(80)  NOT NULL,
    address     VARCHAR(150),
    slug        VARCHAR(60)  NOT NULL,
    created_at  BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_shops_slug UNIQUE (slug)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE users (
    id        BIGINT       NOT NULL AUTO_INCREMENT,
    email     VARCHAR(120) NOT NULL,
    password  VARCHAR(255) NOT NULL,
    role      VARCHAR(20)  NOT NULL,
    shop_id   BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT fk_users_shop FOREIGN KEY (shop_id) REFERENCES shops (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE customers (
    id                BIGINT      NOT NULL AUTO_INCREMENT,
    shop_id           BIGINT      NOT NULL,
    token             VARCHAR(10) NOT NULL,
    name              VARCHAR(50) NOT NULL,
    phone             VARCHAR(20),
    service           VARCHAR(40) NOT NULL,
    status            VARCHAR(10) NOT NULL,
    joined_at         BIGINT      NOT NULL,
    position_at_join  INT,
    queue_order       BIGINT      NOT NULL,
    finished_at       BIGINT,
    served_by_id      BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uk_customers_shop_token UNIQUE (shop_id, token),
    CONSTRAINT fk_customers_shop FOREIGN KEY (shop_id) REFERENCES shops (id),
    CONSTRAINT fk_customers_served_by FOREIGN KEY (served_by_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE password_reset_tokens (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  BIGINT      NOT NULL,
    used_at     BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT uk_reset_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
