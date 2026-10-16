# QueueUp

Digital queues for many barber shops. Customers scan a shop's QR code, join its queue from their
phone and wait anywhere. Shop owners sign up, manage their queue and their staff.

```
frontend/   React 19 + React Router 7 + Tailwind CSS 4 + Vite      (port 5173)
backend/    Java 21 + Spring Boot 4 + Spring Security + JWT + JPA  (port 8080)
            MySQL 8.4                                              (port 3306)
```

> **Going live?** See [DEPLOYMENT.md](DEPLOYMENT.md): Docker, HTTPS, email, backups and a launch checklist.
> Locally the backend runs with the `dev` profile (default); production uses `SPRING_PROFILES_ACTIVE=prod`.

## 1. Database (once)

In MySQL (as root):

```sql
CREATE DATABASE queueup;
CREATE USER 'queueup_app'@'localhost' IDENTIFIED BY 'QueueUp@2026';
GRANT ALL PRIVILEGES ON queueup.* TO 'queueup_app'@'localhost';
```

Flyway creates the tables (`shops`, `users`, `customers`, `password_reset_tokens`) on the first start
from `backend/src/main/resources/db/migration`. An existing database is detected and upgraded.
If you are upgrading from the single-shop version, drop the old tables first:

```sql
USE queueup;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;
```

## 2. Backend

```powershell
cd backend
.\mvnw spring-boot:run        # Windows PowerShell
./mvnw spring-boot:run        # Mac / Linux
```

Ready when the log says `Started BackendApplication`. Check: http://localhost:8080/api/hello

Settings live in `backend/src/main/resources/application.properties`. Every secret can be
overridden with an environment variable, so real values never need to be in the code:

| Variable | Default (local only) | What it is |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/queueup` | Database address |
| `DB_USERNAME` | `queueup_app` | Database user |
| `DB_PASSWORD` | `QueueUp@2026` | Database password |
| `JWT_SECRET` | a development value | Signs login tokens. At least 32 characters. **Change it on a real server.** |
| `JWT_EXPIRATION_MS` | `86400000` (24 h) | How long a login lasts |
| `CORS_ORIGINS` | `http://localhost:*` | Websites allowed to call the API (comma-separated) |

## 3. Frontend

```powershell
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

`VITE_API_URL` (see `.env.example`) points the frontend at the backend.

## How to use it

1. Open http://localhost:5173 → **Create your shop**. You become its admin and get its QR code.
2. Print the QR code (dashboard → **Your QR code**). It points to `/s/<shop-code>`.
3. Customers scan it (or type the shop code on the start page), pick a service and join.
4. Owner and staff sign in at **Sign in**: serve, skip, remove, see daily history.
5. Admins add staff from **Staff**; staff can serve but cannot manage accounts.

## How the shops are kept apart (multi-tenancy)

* Every `user` and `customer` row has a `shop_id`. Token numbers are unique **per shop**.
* Customers reach a shop only through its slug: `/api/public/shops/{slug}/...`.
* Admin/staff endpoints (`/api/business/...`, `/api/users/...`) have **no shop in the URL**.
  `CurrentUser` finds the shop from the signed-in account, so one shop can never touch another.
* Every repository query filters by shop.

## API

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/register-shop` | Anyone (creates shop + admin, returns token) |
| POST | `/api/auth/login` | Anyone |
| POST | `/api/auth/change-password` | Signed in |
| GET | `/api/public/shops/{slug}` | Anyone |
| GET / POST | `/api/public/shops/{slug}/queue` | Anyone (view / join) |
| DELETE | `/api/public/shops/{slug}/queue/{token}` | Anyone (leave) |
| GET | `/api/business/shop` | Admin, staff |
| GET | `/api/business/queue` | Admin, staff |
| POST | `/api/business/queue/{token}/serve` | Admin, staff |
| POST | `/api/business/queue/{token}/skip` | Admin, staff |
| DELETE | `/api/business/queue/{token}` | Admin, staff |
| GET | `/api/business/queue/history` | Admin, staff |
| GET / POST | `/api/users` | Admin (own shop) |
| PUT | `/api/users/{id}/password` | Admin (own shop) |
| DELETE | `/api/users/{id}` | Admin (own shop) |

## Next steps

See section 11 of [DEPLOYMENT.md](DEPLOYMENT.md): per-shop services, email verification,
shared rate limiting for multiple instances, real-time updates.
