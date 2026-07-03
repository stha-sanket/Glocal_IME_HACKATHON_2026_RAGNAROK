# Generated Portals — User & Admin

`create-efc-app`'s **User portal** and **Admin portal** feature options scaffold a large, ready-to-run set of models and routes — everything from auth extras (2FA, sessions, password reset) to admin content management (blogs, FAQs, coupons). This page is the complete inventory, so nothing you didn't ask for shows up as a surprise, and nothing you did enable goes undocumented.

> On MongoDB, every model below is a real `defineModel`-backed collection and every route has working database logic. **On PostgreSQL, model files are commented-out Drizzle stubs and route bodies are `// TODO` placeholders** — the PostgreSQL adapter isn't implemented in the runtime yet. See [Database](./database.md).

---

## Always generated (regardless of portal choices)

- `POST /auth/login`
- `POST /auth/logout`
- `src/model/User.ts`

---

## User portal

Toggling **User portal** adds:

### Models

`User` (extended), `Session`, `Notification`, `File`, `SupportTicket`, `Subscription`, `Invoice`, `ApiKey`

### Routes

| Area | Method & Path |
|---|---|
| Auth | `POST /auth/register` |
| | `GET /auth/me` |
| | `POST /auth/refresh` |
| | `GET /auth/verify-email`, `POST /auth/verify-email` |
| | `POST /auth/forgot-password` |
| | `POST /auth/reset-password` |
| | `POST /auth/change-password` |
| | `GET /auth/2fa/setup`, `POST /auth/2fa/setup` |
| | `POST /auth/2fa/verify` |
| | `POST /auth/2fa/disable` |
| | `GET /auth/sessions`, `DELETE /auth/sessions/:id` |
| Profile | `GET /user/profile`, `PUT /user/profile` |
| | `POST /user/avatar`, `DELETE /user/avatar` |
| | `GET /user/settings`, `PUT /user/settings` |
| | `GET /user/account`, `DELETE /user/account` |
| | `GET /user/dashboard` |
| | `GET /user/activity` |
| Notifications | `GET /user/notifications`, `POST /user/notifications` (mark all read) |
| | `GET /user/notifications/:id`, `PATCH /user/notifications/:id`, `DELETE /user/notifications/:id` |
| Files | `GET /user/files`, `POST /user/files` |
| | `GET /user/files/:id`, `DELETE /user/files/:id` |
| Favorites / bookmarks | `GET /user/favorites`, `POST /user/favorites`, `DELETE /user/favorites/:id` |
| | `GET /user/bookmarks`, `POST /user/bookmarks`, `DELETE /user/bookmarks/:id` |
| Search | `GET /user/search` |
| API keys | `GET /user/api-keys`, `POST /user/api-keys`, `DELETE /user/api-keys/:id` |
| Billing | `GET /user/billing/plans` |
| | `GET /user/billing/subscription`, `POST /user/billing/subscription`, `DELETE /user/billing/subscription` |
| | `GET /user/billing/payment-methods`, `POST /user/billing/payment-methods`, `DELETE /user/billing/payment-methods/:id` |
| | `GET /user/billing/invoices`, `GET /user/billing/invoices/:id` |
| Support | `GET /support/tickets`, `POST /support/tickets` |
| | `GET /support/tickets/:id`, `PUT /support/tickets/:id` |

All protected routes export `middlewares = [requireAuth]` — or `[requireAuth('user', 'admin')]` if [RBAC](./rbac.md) is also enabled.

---

## Admin portal

Toggling **Admin portal** adds:

### Models

`Admin`, `SupportTicket` (shared with User portal if both enabled), `AuditLog`, `Plan` (shared), `FAQ`, `Blog`, `Category`, `Coupon`

### Routes

| Area | Method & Path |
|---|---|
| Dashboard | `GET /admin/dashboard` |
| Users | `GET /admin/users`, `POST /admin/users` |
| | `GET /admin/users/:id`, `PUT /admin/users/:id`, `DELETE /admin/users/:id` |
| | `POST /admin/users/:id/suspend`, `POST /admin/users/:id/activate`, `POST /admin/users/:id/verify` |
| | `GET /admin/users/export` (CSV) |
| Analytics | `GET /admin/analytics`, `/users`, `/revenue`, `/traffic` |
| Admins | `GET /admin/admins`, `POST /admin/admins` |
| | `GET /admin/admins/:id`, `PUT /admin/admins/:id`, `DELETE /admin/admins/:id` |
| Notifications | `GET /admin/notifications`, `POST /admin/notifications` |
| | `POST /admin/notifications/broadcast` |
| Logs | `GET /admin/logs/audit`, `/activity`, `/security` |
| Settings | `GET /admin/settings`, `PUT /admin/settings` |
| System | `GET /admin/system/health` |
| | `DELETE /admin/system/cache` |
| Support | `GET /admin/tickets`, `GET /admin/tickets/:id`, `PUT /admin/tickets/:id` |
| Content — FAQs | `GET /admin/content/faqs`, `POST /admin/content/faqs` |
| | `GET/PUT/DELETE /admin/content/faqs/:id` |
| Content — Blog | `GET /admin/content/blogs`, `POST /admin/content/blogs` |
| | `GET/PUT/DELETE /admin/content/blogs/:id` |
| Content — Categories | `GET /admin/content/categories`, `POST /admin/content/categories` |
| | `GET/PUT/DELETE /admin/content/categories/:id` |
| Billing — Plans | `GET /admin/billing/plans`, `POST /admin/billing/plans` |
| | `GET/PUT/DELETE /admin/billing/plans/:id` |
| Billing — Coupons | `GET /admin/billing/coupons`, `POST /admin/billing/coupons` |
| | `GET/PUT/DELETE /admin/billing/coupons/:id` |
| Billing — Subscriptions | `GET /admin/billing/subscriptions` |
| Roles *(only if RBAC also enabled)* | `GET /admin/roles`, `POST /admin/roles` |
| | `GET/PUT/DELETE /admin/roles/:id` |

All admin routes export `middlewares = [requireAuth('admin')]` if [RBAC](./rbac.md) is enabled — otherwise `middlewares = [requireAuth]` and each handler inline-checks `user.role === 'admin'`.

---

## Related

- [RBAC](./rbac.md) — how the `requireAuth('role')` shorthand and the `Role` model plug into these routes
- [Mailer](./mailer.md) — hook up real email for verification/reset flows
- [Database](./database.md) — MongoDB vs PostgreSQL implementation status
- [Project Structure](../getting-started/project-structure.md) — where these files land on disk
