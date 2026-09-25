# StockFlow

StockFlow is a secure inventory-management application for small businesses. It combines familiar product and supplier CRUD with an immutable stock ledger, tenant isolation, purchase records, low-stock signals, audit history, and exportable reporting.

## Evaluator quick start

StockFlow is designed for a small company with two kinds of users:

| Role | What the user can do |
| --- | --- |
| **Administrator** | Manage products, categories, suppliers, and purchases; invite staff; review all stock movements; monitor live team activity; view reports and export data. |
| **Staff** | View assigned inventory, record validated stock movements, review only their own movement history, use reports and the inventory assistant, and configure personal 2FA. GitHub-authenticated non-admin accounts are presented as **Developer** while retaining this restricted access level. |

### Five-minute assessment walkthrough

1. **Sign in as the administrator.** The seeded overview demonstrates inventory value, stock totals, low/out-of-stock signals, active suppliers, and recent movements.
2. **Open Products.** Filter by stock health, category, or supplier. Administrators can create, update, and archive products; staff receive read-only product access.
3. **Open Team activity.** Invite a staff email and copy the secure link when email delivery is not configured locally.
4. **Open the invitation in a private browser.** Create the staff account, sign in, and record a stock-in or stock-out movement with a business reason.
5. **Return to the administrator browser.** Team activity updates automatically, and the complete movement appears in the administrator audit ledger with its actor, role, reason, and before/after balance.
6. **Open Reports and Ask StockFlow.** Export the spreadsheet-safe CSV, then ask questions such as “What should I reorder?”, “What is my inventory worth?”, or “How do I enable 2FA?”
7. **Open Settings.** Enroll authenticator-app 2FA with the QR code and verify that the next sign-in requires the six-digit code.

The first configured demonstration session expires after one minute to visibly demonstrate session-expiry handling. Later sessions use the normal seven-day duration.

### Reviewer access

- **Live application:** add the deployed HTTPS URL to the repository description and assessment submission.
- **Administrator email:** use the value configured as `SEED_ADMIN_EMAIL`.
- **Administrator password:** provide it privately in the assessment submission; never commit it to this repository.
- **Staff account:** create it during the walkthrough through the administrator’s invitation flow.

For a local review, follow [Local setup](#local-setup), then use the seeded administrator credentials from your local `.env` file.

## Requirement coverage

| Assessment requirement | StockFlow implementation |
| --- | --- |
| Next.js 16 and React | App Router, Server Components, Server Actions, Route Handlers, streaming-friendly server rendering, and focused Client Components. |
| Full-stack CRUD | Products, categories, suppliers, purchase orders, invitations, and stock movements backed by PostgreSQL. |
| Authentication and authorization | Credentials, GitHub OAuth, invitation-only staff registration, role enforcement, 2FA, password recovery, session revocation, and organization isolation. |
| Validation and security | Shared Zod schemas, Argon2id, expiring hashed tokens, rate limiting, immutable audit records, safe CSV export, and transactional stock protection. |
| Responsive UI | Tailwind CSS, mobile navigation, accessible forms and tables, light/dark modes, loading/error/empty states, and responsive pagination. |
| Performance | Server-rendered reads, route-level code splitting, scoped database selections, pagination, and explicit cache/revalidation behavior. |
| AI add-on | Movable/maximizable, voice-enabled inventory assistant with deterministic grounded answers and optional OpenAI Responses API enhancement. |
| Testing and delivery | Vitest, Playwright, strict TypeScript, ESLint, production builds, GitHub Actions, and Vercel-ready deployment. |

## Why this project

Inventory quantity is not a field that should be edited casually. StockFlow treats every change as an attributable transaction, prevents negative stock, detects concurrent updates, and converts current stock into reorder guidance. This makes it a production-style workflow rather than a collection of CRUD screens.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Tailwind CSS 4 and accessible component primitives
- Prisma 7 with PostgreSQL
- Auth.js: verified credentials and GitHub OAuth
- Shared Zod validation on Server Actions/REST APIs, native browser constraints, and Argon2id password hashing
- Vitest and Playwright
- GitHub Actions and Vercel

## Features

- Private organization workspaces with Admin and Staff roles
- Email verification, password recovery, secure sessions, and GitHub sign-in
- RFC 6238 authenticator-app 2FA with QR enrollment and encrypted-at-rest secrets
- Admin-only global signed-in-user/session monitoring with immediate logout removal
- Product, category, supplier, and stock-movement management
- Serializable stock updates with negative-stock and concurrent-write protection
- Inventory value, low-stock, out-of-stock, and reorder signals
- Draggable dashboard AI assistant with query categories, typed and voice-transcribed questions, grounded inventory answers, and optional OpenAI Responses API enhancement
- Search, filters, server-side pagination, and CSV export
- Organization-scoped REST API under `/api/v1`
- Immutable inventory and audit history
- Responsive, keyboard-accessible interface with complete empty/error/loading states
- Field-specific validation for emails, passwords, phone numbers, money, quantities, dates, identifiers, and query parameters

## Local setup

Requirements: Node.js 20.19+ and Docker (or another PostgreSQL 15+ database).

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`. The dedicated administrator uses the credentials from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. Staff registration is invitation-only; an existing GitHub identity can join after its verified email receives an administrator invitation.

To configure GitHub OAuth, create an OAuth App and set its callback URL to:

```text
http://localhost:3000/api/auth/callback/github
```

Then provide `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`. In production, replace the host with the Vercel production domain.

For the assessment demo, leave `GITHUB_ALLOWED_EMAIL_DOMAINS` empty so an evaluator can use a GitHub account with a verified email. For production, configure it with exact comma-separated company domains (for example, `stockflow.com`) to restrict GitHub access to approved company developers. In both modes, the identity must also have an existing workspace membership or valid invitation.

### Transactional email

For a simple assessment demo without purchasing a domain, StockFlow supports Gmail SMTP. Enable 2-Step Verification on the sender account, create a Google App Password, and configure:

```env
GMAIL_SMTP_USER="your-sender@gmail.com"
GMAIL_SMTP_APP_PASSWORD="your-16-character-app-password"
EMAIL_FROM="StockFlow <your-sender@gmail.com>"
```

The App Password is a secret and must never be committed. When both Gmail values are present, Gmail takes precedence over Resend. For production, leave the Gmail values empty and configure `RESEND_API_KEY` plus `EMAIL_FROM` with a verified sending domain.

Without either Gmail SMTP or Resend, the application preserves the invitation/reset flow for local evaluation and writes the complete plain-text email—including its secure link—to the development server console. The administrator UI also exposes the one-time invitation link after a delivery failure.

### AI assistant

Every signed-in dashboard screen includes a movable assistant button. Click it to open the compact chat, maximize it into a focused full-screen workspace, choose a query category, type a question, or use the microphone for browser speech transcription. Its position is remembered on that device.

The assistant always supports verified inventory summaries, greetings, and StockFlow usage guidance through deterministic rules. Set `OPENAI_API_KEY` and `OPENAI_MODEL` to add natural-language answers through the OpenAI Responses API. The key remains server-side, requests are rate-limited, live facts are scoped to the signed-in organization, response storage is disabled, and the assistant has no mutation capability.

## Commands

```bash
pnpm dev          # development server
pnpm typecheck    # strict TypeScript check
pnpm lint         # ESLint
pnpm test         # unit tests
pnpm test:e2e     # Playwright tests
pnpm build        # production build
pnpm db:migrate   # create/apply a development migration
pnpm db:deploy    # apply committed production migrations
pnpm db:seed      # reproducible demo workspace
```

## Security model

- Every tenant-owned query is constrained by `organizationId` derived from the server session.
- Server Actions and REST handlers independently enforce authentication and authorization.
- Browser validation improves feedback, while the same rules are enforced again on the server so crafted requests cannot bypass them.
- Passwords use Argon2id; verification/reset tokens are random, hashed, expiring, and single-use.
- Stock changes use serializable transactions and compare-and-update protection.
- Historical products are archived; movements remain immutable.
- CSV values are neutralized against spreadsheet-formula injection.
- Authentication endpoints use generic errors and basic rate limiting.
- TOTP secrets use AES-256-GCM encryption derived from `AUTH_SECRET`; 2FA verification is required after either password or GitHub authentication.
- `DEMO_SHORT_SESSION_SECONDS` gives each user one visibly short assessment-demo session; the database marker ensures all later sessions return to the normal seven-day duration.

For horizontally scaled production rate limiting, replace the included process-local limiter with a shared Redis/Vercel KV limiter.

## REST examples

```text
GET    /api/v1/products?q=keyboard&page=1&limit=20
POST   /api/v1/products
GET    /api/v1/products/:productId
PATCH  /api/v1/products/:productId
DELETE /api/v1/products/:productId
GET    /api/v1/categories
POST   /api/v1/categories
GET    /api/v1/stock-movements
POST   /api/v1/stock-movements
GET    /api/v1/reports/inventory.csv
```

## Deployment

1. Create a Prisma Postgres database and a Vercel project.
2. Configure variables from `.env.example` in Vercel.
3. Set the production GitHub OAuth callback.
4. Run `pnpm db:deploy` against production.
5. Deploy through the connected GitHub repository. Pull requests receive Vercel previews; GitHub Actions performs quality checks.

### Before submitting the assessment

- Add the live HTTPS URL to the GitHub repository description and submission message.
- Verify the production database migrations and seed data.
- Test administrator credentials in a private browser.
- Test the complete staff invitation, registration, stock movement, and logout flow.
- Update the GitHub OAuth callback to the production domain.
- Verify the Resend sending domain and test invitation/password-reset delivery.
- Add your real candidate name, GitHub URL, and LinkedIn URL through the public environment variables.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.
- Revoke any API keys that have appeared in screenshots or recordings.

## Architecture decisions

- Server Components own reads; small Client Components own interactive forms.
- Server Actions handle first-party form mutations; Route Handlers expose integration-ready REST resources.
- Both interfaces call the same validation and domain services.
- Quantities are cached on products for fast dashboards while movements remain the source of audit truth.

## Candidate

The deployed footer reads the candidate name, GitHub URL, and LinkedIn URL from typed public environment configuration.
