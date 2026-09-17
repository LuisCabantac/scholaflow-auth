# ScholaFlow Auth

[![Hono](https://img.shields.io/badge/Hono-4.13-E36002?logo=hono)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.7-purple)](https://www.better-auth.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle)](https://orm.drizzle.team/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A dedicated, high-performance authentication and session microservice for the [ScholaFlow](https://github.com/LuisCabantac/scholaflow) LMS ecosystem. Built with Hono, Better Auth, Drizzle ORM, and PostgreSQL.

---

## 1. Overview & Key Capabilities

ScholaFlow Auth decouples identity management, credentials, and user sessions from the primary web application and backend domain services. Leveraging Hono's minimal footprint and Better Auth's plugin system with JWT key pair generation (JWKS), it provides an ultra-fast auth gateway capable of servicing distributed microservices and multiple frontend clients simultaneously.

### Core Capabilities

- **JWT & JWKS Stateless Verification:** Generates cryptographically signed JSON Web Tokens via the `jwt()` plugin and exposes standard JWKS (`/api/auth/jwks`) key sets stored in PostgreSQL, allowing downstream services and desktop clients to verify tokens statelessly.
- **Multi-Client Session Management:** Supports web clients via secure cookies, mobile apps via `@better-auth/expo`, and desktop/API clients using JWT tokens.
- **Flexible Social & Credential Auth:** Google OAuth 2.0 and email/password authentication with configurable password complexity requirements and email verification gates.
- **Automated Lifecycle Emails:** Cleanly abstracted transactional mailers (email verification, password resets, and account deletion confirmation) dispatched through Gmail SMTP via Nodemailer.
- **Clean Auth Data Model:** Streamlined Drizzle ORM schema dedicated strictly to identity management (`user`, `session`, `account`, `verification`, and `jwks`).
- **Environment-Aware CORS:** Configurable origin verification dynamically allowing local development ports (`3000`, `8080`, `9245`, `9246`), Wails desktop schemes (`wails://`, `http://wails.localhost`), and canonical production URLs.

---

## 2. Architecture / How it Works

ScholaFlow Auth runs on Hono and intercepts requests routed to `/api/auth/*`, dispatching them directly into the Better Auth handler. Database operations use Drizzle ORM configured with the `postgres` (Postgres.js) driver for non-blocking pooled connectivity.

### System Architecture Flow

```mermaid
flowchart TD
    subgraph Clients ["Frontend & Client Layer"]
        WebClient["Web Client (TanStack Start / Next.js)"]
        WailsClient["Desktop Client (Wails v3 / v2)"]
        ExpoClient["Mobile Client (Expo / React Native)"]
    end

    subgraph APIGateway ["ScholaFlow Auth (Hono Server)"]
        CORSMiddleware["CORS Middleware (src/middleware/cors.ts)"]
        AuthHandler["Better Auth Router (/api/auth/*)"]

        subgraph Engine ["Better Auth Engine (src/lib/auth.ts)"]
            JWTPlugin["JWT Plugin (JWKS & Signed Tokens)"]
            ExpoPlugin["Expo Plugin (Deep Links)"]
            OpenAPIPlugin["OpenAPI Plugin"]
            DrizzleAdapter["Drizzle Adapter (PostgreSQL)"]
        end
    end

    subgraph ExternalServices ["External Services"]
        GoogleOAuth["Google Cloud OAuth 2.0"]
        GmailSMTP["Gmail SMTP (Nodemailer Transporter)"]
    end

    subgraph DataLayer ["Data Persistence Layer"]
        Postgres[("PostgreSQL Database")]
        Schema["Drizzle Auth Schema (user, session, account, verification, jwks)"]
    end

    WebClient -->|"HTTP Requests (Cookies)"| CORSMiddleware
    WailsClient -->|"JWT Token Auth"| CORSMiddleware
    ExpoClient -->|"Mobile Deep Link Auth"| CORSMiddleware

    CORSMiddleware --> AuthHandler
    AuthHandler --> Engine

    Engine -->|"OAuth Handshake"| GoogleOAuth
    Engine -->|"Dispatch Lifecycle Emails"| GmailSMTP
    Engine --> DrizzleAdapter
    DrizzleAdapter --> Schema
    Schema --> Postgres
```

### Authentication Flow Lifecycle

1. **Client Request:** The client dispatches a login, registration, or session validation request to `/api/auth/*`.
2. **CORS Validation:** [`corsMiddleware`](file:///home/luis/dev/projects/SCHOLAFLOW/scholaflow-auth/src/middleware/cors.ts) verifies the incoming `Origin` against `allowedOrigins` (supporting localhost development ports, desktop Wails schemes, and canonical app URLs).
3. **Session & Token Issuance:**
   - **Web Browsers:** Issue secure `HttpOnly` session cookies.
   - **Desktop & API Clients:** Issue signed JSON Web Tokens (JWT) verified against `/api/auth/jwks` for stateless authentication across client sessions and microservices.
   - **Expo Mobile:** Intercepted by `@better-auth/expo` and passed to the mobile runtime via custom deep link schemes and secure store.
4. **Transactional Messaging:** Better Auth lifecycle events trigger asynchronous email dispatches through [`sendVerificationEmail`](file:///home/luis/dev/projects/SCHOLAFLOW/scholaflow-auth/src/lib/service/email.ts), [`sendResetPasswordEmail`](file:///home/luis/dev/projects/SCHOLAFLOW/scholaflow-auth/src/lib/service/email.ts), and [`sendDeleteAccountEmail`](file:///home/luis/dev/projects/SCHOLAFLOW/scholaflow-auth/src/lib/service/email.ts).

---

## 3. Tech Stack

### Framework & Runtime

- **Server Framework:** [Hono v4](https://hono.dev/)
- **Node Server Adapter:** [@hono/node-server](https://github.com/honojs/node-server)
- **Language:** [TypeScript 7.0](https://www.typescriptlang.org/)
- **Runtime:** [Node.js](https://nodejs.org/) (v20+ LTS recommended)

### Authentication & Authorization

- **Auth Framework:** [Better Auth 1.7](https://www.better-auth.com/)
- **Plugins:**
  - `jwt()`: Generates cryptographically signed JWTs and exposes the standard JSON Web Key Set (JWKS) endpoint at `/api/auth/jwks`. Key pairs are persisted in the `jwks` table.
  - `expo()`: Cross-platform mobile OAuth and session synchronization with native deep links.
  - `openAPI()`: OpenAPI schema generation and API contract definitions.

### Database & Persistence

- **Database:** [PostgreSQL](https://www.postgresql.org/) (Compatible with Neon, Supabase, AWS RDS, and local instances)
- **ORM:** [Drizzle ORM 0.45](https://orm.drizzle.team/)
- **Database Driver:** [Postgres.js](https://github.com/porsager/postgres)

### Email & Notifications

- **Mail Transport:** [Nodemailer](https://nodemailer.com/)
- **SMTP Gateway:** Gmail SMTP (`smtp.gmail.com`)

---

## 4. Project Structure

```text
scholaflow-auth/
├── src/
│   ├── db/
│   │   ├── index.ts              # Postgres.js client and Drizzle database connection
│   │   └── schema.ts             # Dedicated PostgreSQL Auth schema (user, session, account, verification, jwks)
│   ├── lib/
│   │   ├── service/
│   │   │   └── email.ts          # Nodemailer transporter and transactional email dispatchers
│   │   └── auth.ts               # Better Auth engine configuration and JWT plugin setup
│   ├── middleware/
│   │   └── cors.ts               # Centralized CORS middleware and trusted origin registry
│   └── index.ts                  # Hono application entry point and HTTP server listener
├── .env.example                  # Environment variable reference template
├── package.json                  # Dependencies, scripts, and runtime engine specs
├── tsconfig.json                 # TypeScript compiler configuration
└── LICENSE                       # MIT License
```

---

## 5. Getting Started

### Prerequisites

- **Node.js:** v20.x or higher
- **Package Manager:** `npm`, `pnpm`, or `bun`
- **PostgreSQL Database:** A running PostgreSQL instance
- **Google Cloud Console Credentials:** For Google OAuth 2.0
- **Google App Password:** For Gmail SMTP transactional mail delivery

---

### Step-by-Step Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/LuisCabantac/scholaflow-auth.git
cd scholaflow-auth
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create your local `.env` file:

```bash
cp .env.example .env
```

Populate the required environment variables:

| Variable               | Required | Description                              | Example / Default                                            |
| :--------------------- | :------: | :--------------------------------------- | :----------------------------------------------------------- |
| `DATABASE_URL`         | **Yes**  | PostgreSQL connection string             | `postgresql://postgres:[password]@localhost:5432/scholaflow` |
| `BETTER_AUTH_SECRET`   | **Yes**  | 32+ character secret to sign sessions    | Generate with `openssl rand -base64 32`                      |
| `BETTER_AUTH_URL`      | **Yes**  | Base URL where this API is hosted        | `http://localhost:8080`                                      |
| `APP_URL`              | **Yes**  | Canonical URL of your primary frontend   | `http://localhost:3000`                                      |
| `GOOGLE_CLIENT_ID`     | **Yes**  | Google OAuth 2.0 Web Client ID           | `xxx.apps.googleusercontent.com`                             |
| `GOOGLE_CLIENT_SECRET` | **Yes**  | Google OAuth 2.0 Client Secret           | `GOCSPX-xxxxxx`                                              |
| `APP_GMAIL_EMAIL`      | **Yes**  | Sender email address for SMTP            | `your-app@gmail.com`                                         |
| `APP_GMAIL_PASSWORD`   | **Yes**  | Google Account 16-character App Password | `xxxx xxxx xxxx xxxx`                                        |
| `PORT`                 | Optional | Port for the HTTP listener               | `8080` (default)                                             |
| `NODE_ENV`             | Optional | Application runtime environment          | `development` or `production`                                |

#### 4. Run the Development Server

```bash
npm run dev
```

The server will start listening at [http://localhost:8080](http://localhost:8080).

#### 5. Verify Server Health

```bash
curl http://localhost:8080/healthz
# Response: OK
```

#### 6. Build for Production

```bash
npm run build
npm start
```

---

## 6. Client Integration Guide

### A. Web Client (TanStack Start / React)

Connect using `@better-auth/react`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:8080", // Points to scholaflow-auth
});
```

### B. Desktop Client (Wails) & JWT Bearer Token

For desktop applications or backend services utilizing JSON Web Tokens, use the JWT plugin on the client:

```typescript
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "https://auth.yourdomain.com",
  plugins: [jwtClient()],
});

// Obtain the signed JWT for authorization headers:
const token = await authClient.token();

// Downstream API requests with JWT:
const response = await fetch("https://api.yourdomain.com/data", {
  headers: {
    Authorization: `Bearer ${token.data?.token}`,
  },
});
```

Downstream services can verify the token using the public JWKS endpoint provided at `/api/auth/jwks`.

### C. Expo (React Native Mobile)

```typescript
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "https://auth.yourdomain.com",
  plugins: [
    expoClient({
      scheme: "scholaflow",
      storage: SecureStore,
    }),
  ],
});
```

---

## 7. Troubleshooting / Error Handling

### 1. Database Connection Timeout or SSL Rejection

- **Symptom:** `error: connection to server failed: Connection refused` or `SSL connection closed unexpectedly`.
- **Resolution:** Verify `DATABASE_URL` is correct. If connecting to a cloud provider (Supabase, Neon, AWS RDS), append `?sslmode=require` or ensure connection pooler port `6543` / `5432` is accessible.

### 2. CORS Blocked on Desktop or Local Dev Ports

- **Symptom:** Browser or desktop client reports `Cross-Origin Request Blocked` or `Origin is not allowed by Access-Control-Allow-Origin`.
- **Resolution:** Verify that your client URL or scheme (`http://localhost:<port>`, `wails://localhost`, etc.) is registered in `devOrigins` or `desktopOrigins` within [`cors.ts`](file:///home/luis/dev/projects/SCHOLAFLOW/scholaflow-auth/src/middleware/cors.ts).

### 3. Session Cookies Not Retained Across Navigations

- **Symptom:** User is redirected to login immediately after authenticating in the browser.
- **Resolution:** Ensure `BETTER_AUTH_URL` and `APP_URL` accurately match the protocol and domain of the deployment. In production, ensure both client and server use HTTPS so secure cookies are retained.

### 4. Transactional Emails Failing to Send

- **Symptom:** Verification emails or password reset requests fail silently or log `Invalid login: 535-5.7.8 Username and Password not accepted`.
- **Resolution:** Ensure 2-Step Verification is active on the sender Gmail account and that `APP_GMAIL_PASSWORD` is a 16-character **Google App Password**, not the primary account password.

---

## License

This project is licensed under the [MIT License](LICENSE).
