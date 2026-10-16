# Production hardening: changed files

Replace your project with this one (back up your current folder first), or copy these files over it.

## Backend (`backend/`)
| File | Change |
|---|---|
| `pom.xml` | + Flyway (`spring-boot-starter-flyway`, `flyway-mysql`), + Actuator |
| `src/main/resources/application.properties` | Shared settings; secrets have no defaults here |
| `src/main/resources/application-dev.properties` (new) | Local defaults; default profile |
| `src/main/resources/application-prod.properties` (new) | `ddl-auto=validate`, no SQL logs, no leaked errors, proxy headers |
| `src/main/resources/db/migration/V1__initial_schema.sql` (new) | The full schema |
| `src/main/resources/db/migration/V2__production_hardening.sql` (new) | ticket_key, version, token_version, queue index |
| `BackendApplication.java` | `@EnableScheduling` |
| `Customer.java` | Ticket key (+ constant-time check), `@Version` |
| `User.java` | `tokenVersion`, `revokeTokens()` |
| `CustomerRepository.java`, `PasswordResetTokenRepository.java` | Retention deletes |
| `JoinResponse.java` | + `ticketKey` (only for the joiner) |
| `QueueService.java` | Creates ticket keys; `leave` requires the key |
| `RetentionJob.java` (new) | Nightly clean-up (03:30 Nepal time) |
| `MailService.java` | SMTP failures are logged, never shown to users |
| `PasswordResetService.java` | Reset signs the account out everywhere |
| `controller/PublicQueueController.java` | Join retries on duplicate token; leave needs `X-Ticket-Key` |
| `controller/AuthController.java` | Token version in JWTs; password change signs out everywhere; 409 for taken emails |
| `controller/UserController.java` | Admin reset signs the staff member out; 409 for taken emails |
| `controller/GlobalExceptionHandler.java` (new) | One JSON error shape; 409 for conflicts; safe 500s |
| `security/JwtService.java` | `ver` claim; secret length checked at startup |
| `security/JwtAuthenticationFilter.java` | Rejects tokens with an old version |
| `security/RateLimitFilter.java` (new) | Per-IP limits on login, sign-up, reset, join → 429 |
| `security/SecurityConfig.java` | Rate limiter, health endpoint, `X-Ticket-Key` header, security headers |
| `src/test/java/.../QueueServiceTest.java` (new) | 3 unit tests |
| `Dockerfile`, `.dockerignore` (new) | Production image |

## Frontend (`frontend/`)
| File | Change |
|---|---|
| `src/services/api.js` | Empty `VITE_API_URL` = same origin; server's message for 403 |
| `src/services/queueService.js` | Sends the ticket key when leaving |
| `src/context/QueueContext.jsx` | Stores the ticket key per shop |
| `src/pages/ChangePassword.jsx` | Signs out after a password change |
| `Dockerfile`, `nginx.conf`, `.dockerignore` (new) | Production image with SPA routing and `/api` proxy |

## Project root (new)
`docker-compose.yml`, `Caddyfile`, `.env.example`, `backup.sh`, `.github/workflows/ci.yml`, `.gitignore`,
`DEPLOYMENT.md` (step-by-step go-live guide).
