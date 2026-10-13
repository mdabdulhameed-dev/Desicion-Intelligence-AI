# Stratagem AI | Backend Application Tier (`/server`)

This folder contains the **Backend REST API Service & AI Intelligence Core** for the Stratagem AI Decision Intelligence platform.

---

## ⚙️ Role & Responsibilities
- **Runs on**: Node.js Server Process (v18+)
- **Local Dev Server**: `http://localhost:5000` (via Express & Nodemon)
- **Tech Stack**: Express.js, Zod, JWT, bcryptjs, @supabase/supabase-js, pg, csv-parse, Multer
- **Core Goal**: Execute mathematical decision models (TOPSIS, Monte Carlo risk simulation, Tornado sensitivity swings, Explainable AI generation), enforce JWT security and bcrypt hashing, validate payloads via Zod, and persist scenarios to Supabase PostgreSQL or local file store.

---

## 📁 Internal Directory Structure

```
server/
├── data/
│   └── db.json                  # Persistent JSON storage file with atomic writes
│
├── src/
│   ├── index.js                 # Express server bootstrap & HTTP listener
│   ├── config/
│   │   └── env.js               # Environment variables configuration reader
│   │
│   ├── db/                      # Persistence & Database Access
│   │   ├── store.js             # Hybrid data repository (Supabase + local fallback)
│   │   ├── supabase.js          # Supabase client connector & CRUD operations
│   │   ├── migrate.js           # Database migration & variable output runner
│   │   └── test-supabase.js     # Diagnostic Supabase connection handshake tester
│   │
│   ├── schemas/                 # Strict Zod Validation Schemas
│   │   ├── auth.schema.js       # Register and login payload schemas
│   │   └── decision.schema.js   # Criteria, alternatives, and simulation schemas
│   │
│   ├── middleware/              # Express Middlewares
│   │   ├── auth.middleware.js   # JWT signature verification
│   │   ├── validate.middleware.js # Generic Zod request validator
│   │   └── error.middleware.js  # Global centralized error handler
│   │
│   ├── engine/                  # Core AI Decision Intelligence Modules
│   │   ├── mcda.js              # TOPSIS vector normalization, WSM, Pareto optimality
│   │   ├── monteCarlo.js        # Stochastic Monte Carlo simulation (VaR 95%, P10/P50/P90)
│   │   ├── sensitivity.js       # Tornado sensitivity analysis & tipping points
│   │   └── explainableAi.js     # XAI reasoning & 3-phase strategic roadmap
│   │
│   ├── controllers/             # Business Logic Handlers
│   │   ├── auth.controller.js   # Register, login, demoLogin, getProfile
│   │   └── decision.controller.js # Decision CRUD, MCDA, simulation, and CSV parser
│   │
│   └── routes/                  # Express REST Routes
│       ├── api.js               # Central API router (/health, /auth, /decisions)
│       ├── auth.routes.js       # Authentication endpoints
│       └── decision.routes.js   # Protected decision framework endpoints
│
├── test/                        # Automated Backend Test Suite
│   ├── decision-engine.test.js  # Mathematical unit tests (TOPSIS, Monte Carlo, Tornado)
│   └── api-integration.test.js  # REST API integration tests (Auth, CRUD, Simulation)
│
├── .env                         # Server environment variables & Supabase keys
├── .env.example                 # Template for server environment variables
└── package.json                 # Backend dependencies & scripts
```

---

## 🚀 How to Run the Backend Independently

```bash
# From the project root:
npm run dev:server

# Or from inside the server/ directory:
cd server
npm run dev
```

---

## 🧪 Testing & Database Commands

```bash
# Run all backend unit and integration tests (11/11 passing)
npm test --workspace=server

# Test live connection handshake to Supabase
npm run test:supabase --workspace=server

# Test live connection handshake to Google Gemini AI
npm run test:gemini --workspace=server

# Run Supabase migration and emit all variables
npm run migrate --workspace=server
```
