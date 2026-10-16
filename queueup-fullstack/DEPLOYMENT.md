# Deploying QueueUp

This guide takes QueueUp from your laptop to a real server with HTTPS, email, backups and monitoring.

```
Internet ──HTTPS──▶ Caddy (certificates) ──▶ nginx (React app, /api proxy) ──▶ Spring Boot (prod profile) ──▶ MySQL
```

## 1. What the code now does for production

| Area | What's in place |
|---|---|
| Schema | Flyway migrations (`db/migration/V1`, `V2`); prod uses `ddl-auto=validate` |
| Configuration | `dev` profile (default, safe local defaults) and `prod` profile (secrets required, app refuses to start without them) |
| Secrets | JWT secret (min. 32 chars, checked at startup), database and mail credentials from environment variables |
| Tickets | A secret ticket key per customer; only the phone that joined can leave |
| Rate limiting | Login 10/min, shop sign-up 5/h, forgot password 5/h, reset 10/h, join 10/min per IP → 429 |
| Concurrency | `@Version` optimistic locking (double serve → 409); duplicate-token joins retried automatically |
| Sessions | Token version: changing or resetting a password signs the account out on every device |
| Errors | One JSON error shape (`GlobalExceptionHandler`); no internal details leaked in prod |
| Privacy | Finished customers deleted after 90 days; expired reset links cleaned nightly |
| Ops | `/actuator/health`, Docker images, HTTPS via Caddy, daily backup script, CI on GitHub |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options: DENY` |

## 2. Before you deploy: verify locally

1. **Run the backend** (`cd backend`, `.\mvnw spring-boot:run`). The first start downloads the new
   libraries. Flyway logs either `Successfully baselined schema` (existing database) or
   `Successfully applied 2 migrations` (empty database). Then `Started BackendApplication`.
2. **Run the tests:** `.\mvnw test`. If your project still has Spring Initializr's
   `BackendApplicationTests` (`@SpringBootTest`, `contextLoads`), delete it or keep MySQL running:
   it needs a database. The new `QueueServiceTest` doesn't.
3. **Click through every flow** with two shops in two browser profiles:
   - [ ] Create shop A and shop B; each gets its own QR page
   - [ ] Join A's queue as a customer; leave from the ticket page (works)
   - [ ] In Postman, `DELETE /api/public/shops/<A>/queue/1` with no `X-Ticket-Key` → **403**
   - [ ] Serve / skip / remove at A; B's dashboard never shows A's customers
   - [ ] Add a staff member at A; they can serve, can't open Staff (403)
   - [ ] Staff performance shows the right counts
   - [ ] Forgot password: link printed in the backend log, reset works, link works only once
   - [ ] After a password change or reset, the old login is signed out (next request → sign-in page)
   - [ ] Wrong password 11 times in a minute → "Too many attempts" (429)

## 3. Server and domain

- A small Linux VPS is enough to start (2 GB RAM, e.g. DigitalOcean, Hetzner, AWS Lightsail).
- Install Docker: `curl -fsSL https://get.docker.com | sh`
- Buy a domain and create an **A record** pointing to the server's IP (e.g. `queueup.example.com`).
- Open ports 80 and 443 only.

## 4. Configure and start

```sh
git clone <your repo> /opt/queueup && cd /opt/queueup
cp .env.example .env
openssl rand -base64 48        # paste the result as JWT_SECRET
nano .env                      # fill in DOMAIN, passwords, mail settings
docker compose up -d --build
docker compose logs -f backend # wait for "Started BackendApplication"
```

Open `https://<your domain>`. Caddy obtains the HTTPS certificate automatically on first visit.

## 5. Email (password resets)

Use a transactional email service; Brevo's free plan is enough for a pilot. Put its SMTP host, port,
username and key in `.env` (`SPRING_MAIL_*`) and set `MAIL_FROM` to an address on a domain you've
verified with the provider. Test with "Forgot password?". Without `SPRING_MAIL_HOST`, emails only
appear in `docker compose logs backend`.

## 6. First shops and QR codes

Each pilot shop creates its account on the live site, opens **Your QR code**, downloads it and prints
it. Old QR codes made on your laptop pointed at `localhost` and won't work on phones.

## 7. Backups (do this on day one)

```sh
crontab -e
30 2 * * * /opt/queueup/backup.sh >> /opt/queueup/backups/backup.log 2>&1
```

Copy `backups/` off the server regularly. **Test a restore once:**

```sh
gunzip -c backups/queueup-<date>.sql.gz | docker compose exec -T mysql mysql -u root -p"<root password>" queueup
```

## 8. Updating

```sh
cd /opt/queueup && git pull && docker compose up -d --build
```

Schema changes must be new migration files (`V3__...sql`, never edit an applied one). Flyway applies
them at startup; in prod Hibernate only validates.

## 9. Monitoring

- An uptime monitor (UptimeRobot, free) on `https://<domain>/api/hello`, alerting you by email.
- Logs: `docker compose logs -f backend`. Look for `ERROR` lines and 429 spikes.

## 10. Environment variables

| Variable | Needed | Example / note |
|---|---|---|
| `DOMAIN` | Yes | `queueup.example.com` |
| `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` | Yes | Long random values |
| `JWT_SECRET` | Yes | ≥ 32 characters; `openssl rand -base64 48`. Changing it signs everyone out |
| `SPRING_MAIL_HOST`, `_PORT`, `_USERNAME`, `_PASSWORD`, `MAIL_FROM` | For real emails | From your email provider |
| `RETENTION_DAYS` | No | Default 90 |
| `RATE_LIMIT_ENABLED` | No | Default true |

## 11. Known limits (plan these next)

- **Rate limits are per server instance** (in memory). Running several backend copies? Move to Redis/Bucket4j.
- **Services are the same for every shop** (`frontend/src/config/business.js`). Per-shop services, prices and opening hours are the main product feature to add.
- **No email verification at sign-up**, so fake shops are possible (rate limiting slows them down).
- **Polling every 5 s** is fine for a pilot; for many shops add caching or WebSockets.
- **Privacy notice:** tell customers what you store (name, optional phone) and for how long (90 days).
