# ScholaFlow API

[![Hono](https://img.shields.io/badge/Hono-4.13-E36002?logo=hono)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.7-purple)](https://www.better-auth.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle)](https://orm.drizzle.team/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A lightweight, high-performance authentication and session microservice for the [ScholaFlow](https://github.com/LuisCabantac/scholaflow) LMS ecosystem. Built with Hono, Better Auth, Drizzle ORM, and PostgreSQL.

> [!NOTE]
> This API serves as the centralized authentication backbone for ScholaFlow. It is architected to power the application when transitioning the frontend from Next.js to **TanStack Start (React)**, while providing out-of-the-box native session handoff for **Wails desktop** and **Expo mobile** clients.

---

## 1. Overview & Key Capabilities

ScholaFlow API decouples identity management and user sessions from the primary web application. By leveraging Hono's minimal footprint and Better Auth's extensible plugin architecture, it provides an ultra-fast auth gateway capable of servicing multiple frontend targets simultaneously.

### Core Capabilities

- **Multi-Client Session Management:** Natively supports web clients (cookies), mobile applications via `@better-auth/expo`, and desktop clients via the `bearer()` plugin (`Authorization: Bearer <token>`).
- **Wails Desktop OAuth Bridge:** Features custom redirect hooks that capture OAuth callbacks from external system browsers and deliver the session token into Wails custom URL schemes (`wails://localhost`, `http://wails.localhost`).
- **Flexible Social & Credential Auth:** Google OAuth 2.0 and email/password authentication with configurable password complexity requirements and email verification gates.
- **Automated Lifecycle Emails:** Cleanly abstracted transactional mailers (email verification, password resets, and account deletion confirmation) dispatched through Gmail SMTP via Nodemailer.
- **Custom User Schemas:** Extends core Better Auth user schemas with application-specific metadata (`role`, `schoolName`) mapped directly to PostgreSQL tables via Drizzle ORM.
- **Environment-Aware CORS:** Configurable origin verification that dynamically allows local development ports (`3000`, `8080`, `9245`, `9246`), Wails desktop schemes, and canonical production URLs.

---

## 2. Architecture / How it Works

ScholaFlow API runs on Hono and intercepts requests routed to `/api/auth/*`, dispatching them directly into the Better Auth handler. Database operations use Drizzle ORM configured with the `postgres` (Postgres.js) driver for non-blocking pooled connectivity.

### System Architecture Flow

```mermaid
flowchart TD
    subgraph Clients ["Frontend & Client Layer"]
        WebClient["Web Client (TanStack Start / Next.js)"]
        WailsClient["Desktop Client (Wails v3 / v2)"]
        ExpoClient["Mobile Client (Expo / React Native)"]
    end

    subgraph APIGateway ["ScholaFlow API (Hono Server)"]
        CORSMiddleware["CORS Middleware (src/middleware/cors.ts)"]
        AuthHandler["Better Auth Router (/api/auth/*)"]

        subgraph Engine ["Better Auth Engine (src/lib/auth.ts)"]
            BearerPlugin["Bearer Plugin (Token Auth)"]
            ExpoPlugin["Expo Plugin (Deep Links)"]
            OAuthHook["OAuth Callback Hook (Wails Token Injection)"]
            DrizzleAdapter["Drizzle Adapter (PostgreSQL)"]
        end
    end

    subgraph ExternalServices ["External Services"]
        GoogleOAuth["Google Cloud OAuth 2.0"]
        GmailSMTP["Gmail SMTP (Nodemailer Transporter)"]
    end

    subgraph DataLayer ["Data Persistence Layer"]
        Postgres[("PostgreSQL Database")]
        Schema["Drizzle Schema (Users, Sessions, Accounts)"]
    end

    WebClient -->|"HTTP Requests (Cookies)"| CORSMiddleware
    WailsClient -->|"Bearer Token / Popup OAuth"| CORSMiddleware
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
2. **CORS Validation:** `corsMiddleware` verifies the incoming `Origin` against `allowedOrigins` (supporting localhost development ports, desktop Wails schemes, and canonical app URLs).
3. **Session Issuance:**
   - **Web Browsers:** Issue secure `HttpOnly` session cookies.
   - **Wails Desktop:** The OAuth callback hook intercepts redirects to Wails schemes (`wails://`, `wails.localhost`, or `?popup=true`), appends `?token=<sessionToken>`, allowing the desktop app to store it and authenticate subsequent calls via `Authorization: Bearer <token>`.
   - **Expo Mobile:** Intercepted by `@better-auth/expo` and passed to the mobile runtime via custom deep link schemes.
4. **Transactional Messaging:** Better Auth lifecycle events trigger asynchronous email dispatches through [src/lib/service/email.ts](file:///home/luis/dev/projects/SCHOLAFLOW/scholaflow-api/src/lib/service/email.ts).

---

## 3. Tech Stack

### Framework & Runtime

- **Server Framework:** [Hono v4](https://hono.dev/)
- **Node Server Adapter:** [@hono/node-server](https://github.com/honojs/node-server)
- **Language:** [TypeScript 7.0](https://www.typescriptlang.org/)
- **Runtime:** [Node.js](https://nodejs.org/) (v20+ LTS recommended) / compatible with Vercel Serverless

### Authentication & Authorization

- **Auth Framework:** [Better Auth 1.7](https://www.better-auth.com/)
- **Plugins:**
  - `bearer()`: Enables RFC 6750 Bearer token authorization headers.
  - `expo()`: Cross-platform mobile OAuth and session synchronization.
  - `openAPI()`: OpenAPI schema generation and contract definitions.
  - `inferAdditionalFields()`: Type-safe schema extensions for custom user metadata.

### Database & Persistence

- **Database:** [PostgreSQL](https://www.postgresql.org/) (Compatible with Neon, Supabase, AWS RDS, local instances)
- **ORM:** [Drizzle ORM 0.45](https://orm.drizzle.team/)
- **Database Driver:** [Postgres.js](https://github.com/porsager/postgres)

### Email & Notifications

- **Mail Transport:** [Nodemailer](https://nodemailer.com/)
- **SMTP Gateway:** Gmail SMTP (`smtp.gmail.com`)

---

## 4. Project Structure

```text
scholaflow-api/
├── src/
│   ├── db/
│   │   ├── index.ts              # Postgres.js client and Drizzle database connection
│   │   └── schema.ts             # Complete PostgreSQL schema (Auth, Classes, Streams, Roles)
│   ├── lib/
│   │   ├── service/
│   │   │   └── email.ts          # Nodemailer transporter and transactional email dispatchers
│   │   └── auth.ts               # Better Auth engine configuration, plugins, and hooks
│   ├── middleware/
│   │   └── cors.ts               # Centralized CORS middleware and trusted origin registry
│   └── index.ts                  # Hono application entry point and HTTP server listener
├── .env.example                  # Environment variable reference template
├── package.json                  # Dependencies, scripts, and runtime engine specs
├── tsconfig.json                 # TypeScript compiler configuration (NodeNext / ESNext)
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
git clone https://github.com/LuisCabantac/scholaflow-api.git
cd scholaflow-api
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
| `DATABASE_URL`         | **Yes**  | PostgreSQL connection connection string  | `postgresql://postgres:[password]@localhost:5432/scholaflow` |
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
  baseURL: "http://localhost:8080", // Points to scholaflow-api
});
```

### B. Wails Desktop Client

Wails desktop apps can authenticate via the `bearer()` plugin. When opening Google OAuth via a secondary window or system browser, the callback URL includes `?popup=true`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://api.yourdomain.com",
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => localStorage.getItem("bearer_token") || "",
    },
  },
});

// Triggering Google Sign-In:
await authClient.signIn.social({
  provider: "google",
  callbackURL: `${window.location.origin}/?popup=true`,
  disableRedirect: true,
});
```

The OAuth callback hook in `scholaflow-api` detects the popup/Wails origin and appends the session token to the redirect query parameters. The desktop client reads the token, stores it in `localStorage`, and supplies it in subsequent request headers.

### C. Expo (React Native)

```typescript
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: "https://api.yourdomain.com",
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
- **Resolution:** Verify that your client URL or scheme (`http://localhost:<port>`, `wails://localhost`, etc.) is registered in `devOrigins` or `desktopOrigins` within [src/middleware/cors.ts](file:///home/luis/dev/projects/SCHOLAFLOW/scholaflow-api/src/middleware/cors.ts).

### 3. Session Cookies Not Retained Across Navigations

- **Symptom:** User is redirected to login immediately after authenticating in the browser.
- **Resolution:** Ensure `BETTER_AUTH_URL` and `APP_URL` accurately match the protocol and domain of the deployment. In production, ensure both client and server use HTTPS so secure cookies are retained.

### 4. Transactional Emails Failing to Send

- **Symptom:** Verification emails or password reset requests fail silently or log `Invalid login: 535-5.7.8 Username and Password not accepted`.
- **Resolution:** Ensure 2-Step Verification is active on the sender Gmail account and that `APP_GMAIL_PASSWORD` is a 16-character **Google App Password**, not the primary account password.

---

## License

This project is licensed under the [MIT License](LICENSE).
