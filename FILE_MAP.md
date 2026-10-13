# Stratagem AI | Exhaustive File Classification & Role Map

This document provides a complete file-by-file categorization distinguishing **Frontend (`/client`)** files from **Backend (`/server`)** files, their runtime environment, their imports, and their exact responsibilities.

---

## 🎨 FRONTEND FILES (`/client/`)
> **Runtime Environment**: Browser (Client-side DOM, React Virtual DOM, V8/SpiderMonkey)  
> **Runs on**: `http://localhost:3000` (via Vite Dev Server or Static CDN in production)  
> **Output**: HTML, CSS, JS bundle executed exclusively on the user's machine.

| File Path | Role | Description |
| :--- | :--- | :--- |
| **`client/index.html`** | HTML Host Shell | Entry point for the browser. Loads Google Fonts (`Outfit`, `Plus Jakarta Sans`, `JetBrains Mono`) and mounts `<div id="root">`. |
| **`client/vite.config.js`** | Frontend Bundler Config | Configures Vite 6, `@vitejs/plugin-react`, port 3000, and proxy rules forwarding `/api` calls to `http://localhost:5000`. |
| **`client/tailwind.config.js`** | Styling System Tokens | Configures color palette (`brand`, `accent`, `surface`), glowing box shadows, and dark mode classes. |
| **`client/postcss.config.js`** | CSS Preprocessor Config | Configures `tailwindcss` and `autoprefixer` plugins. |
| **`client/package.json`** | Frontend Dependencies | Defines React 18, Recharts, Lucide Icons, Axios, Tailwind, Vite, and build scripts. |
| **`client/.env.example`** | Frontend Environment Sample | Documents `VITE_API_BASE_URL` used to target the backend API across different environments. |
| **`client/src/main.jsx`** | React Application Bootstrap | Entry JavaScript file that attaches React StrictMode and renders `<App />` into the DOM `#root`. |
| **`client/src/App.jsx`** | Router & Route Guard | Defines client-side routes (`/login`, `/register`, `/`, `/decision/:id`) and wraps protected views with `<ProtectedRoute>`. |
| **`client/src/index.css`** | Global Design System CSS | Tailwind directives, glassmorphism utilities (`.glass-panel`, `.glass-card`), glowing borders, and custom scrollbars. |
| **`client/src/api/client.js`** | HTTP API Client | Axios instance configured with `baseURL`. Injects `Authorization: Bearer <token>` from `localStorage` and handles 401 redirects. |
| **`client/src/context/AuthContext.jsx`** | Client Session State | React Context managing `user`, `token`, `login()`, `register()`, `demoLogin()`, and `logout()`. |
| **`client/src/pages/Login.jsx`** | Authentication View | Enterprise login form featuring 1-click Demo Login for instant test access. |
| **`client/src/pages/Register.jsx`** | Registration View | Organization analyst signup form with name, email, password, and company fields. |
| **`client/src/pages/Dashboard.jsx`** | Primary Portal View | Decision project catalog, metric KPI cards, category filters, search bar, and quick actions. |
| **`client/src/pages/DecisionWorkspace.jsx`** | Interactive Studio View | Comprehensive workspace coordinating the 5 decision intelligence tabs (Scorecard, What-If, Risk, Matrix, Audit). |
| **`client/src/components/Navbar.jsx`** | Header Navigation | Brand logo, active AI engine status pill, user avatar, and quick action modals triggers. |
| **`client/src/components/StatCard.jsx`** | KPI Display Component | Glassmorphic card displaying aggregates, icons, subtexts, and glowing accent borders. |
| **`client/src/components/DecisionRadarChart.jsx`** | Radar Visualizer | Recharts `RadarChart` mapping multi-dimensional criteria scores (0–100) across competing alternatives. |
| **`client/src/components/MonteCarloDistributionChart.jsx`** | Stochastic Risk Visualizer | Recharts `AreaChart` plotting probability density curves, VaR 95%, and P10/P50/P90 percentile breakdown. |
| **`client/src/components/TornadoChart.jsx`** | Sensitivity Visualizer | Recharts horizontal `BarChart` displaying criterion volatility leverage and critical rank-flipping tipping points. |
| **`client/src/components/SensitivitySliders.jsx`** | Real-Time What-If Sandbox | Interactive weight sliders triggering live client recalculations and rank-flip detection. |
| **`client/src/components/IngestModal.jsx`** | Data Ingestion Modal | CSV upload, raw text pasting, and 1-click pre-built enterprise benchmark templates. |
| **`client/src/components/NewDecisionModal.jsx`** | Scenario Builder Modal | Interactive wizard for manually structuring criteria, weights, units, and alternatives. |
| **`client/src/components/ExplainableBriefModal.jsx`** | Executive Brief Modal | Board-ready export and print view with XAI trade-off insights and phased action roadmap. |

---

## ⚙️ BACKEND FILES (`/server/`)
> **Runtime Environment**: Node.js Server Runtime (Node v18+)  
> **Runs on**: `http://localhost:5000`  
> **Output**: Secure JSON API endpoints, JWT authentication tokens, file-backed persistence.

| File Path | Role | Description |
| :--- | :--- | :--- |
| **`server/package.json`** | Backend Dependencies | Express, Zod, JWT, bcryptjs, Multer, csv-parse, uuid, nodemon, and test scripts. |
| **`server/.env.example`** | Backend Environment Sample | Documents `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CORS_ORIGIN`. |
| **`server/src/index.js`** | Express Server Entrypoint | Initializes Express, mounts CORS, JSON body parsers, API routes, request logger, error handler, and starts port 5000 listener. |
| **`server/src/config/env.js`** | Server Environment Config | Loads `.env` via `dotenv` and exports strongly-typed configuration defaults. |
| **`server/src/db/store.js`** | Persistence & Data Store | File-backed JSON database engine with atomic disk sync and pre-seeded realistic enterprise scenarios. |
| **`server/data/db.json`** | Database File | JSON disk storage containing `users` and `decisions` records. |
| **`server/src/schemas/auth.schema.js`** | Auth Validation Schemas | Zod validation schemas for `registerSchema` and `loginSchema`. |
| **`server/src/schemas/decision.schema.js`** | Decision Validation Schemas | Zod validation schemas for `criterionSchema`, `alternativeSchema`, `createDecisionSchema`, and `simulateDecisionSchema`. |
| **`server/src/middleware/auth.middleware.js`** | JWT Verification Middleware | Verifies `Authorization: Bearer <token>` header and injects `req.user`. |
| **`server/src/middleware/validate.middleware.js`** | Generic Zod Middleware | Intercepts requests and enforces schema rules, returning clean 400 JSON errors upon validation failure. |
| **`server/src/middleware/error.middleware.js`** | Global Error Handler | Centralized catch-all middleware ensuring server never crashes and returns structured JSON responses. |
| **`server/src/engine/mcda.js`** | Multi-Criteria Decision Core | Implements vector normalization, positive/negative ideal solutions, TOPSIS closeness ($C^*$), WSM, and Pareto dominance. |
| **`server/src/engine/monteCarlo.js`** | Stochastic Risk Engine | Runs 1,000–10,000 randomized iterations with Box-Muller Gaussian / Triangular sampling, calculating VaR 95% and percentiles. |
| **`server/src/engine/sensitivity.js`** | Sensitivity & Tornado Engine | Perturbs criteria weights across a 0.1x to 3.0x multiplier spectrum and detects switching thresholds. |
| **`server/src/engine/explainableAi.js`** | Explainable AI (XAI) Engine | Generates natural language strategic advantages, accepted compromise trade-offs, and a 3-phase strategic roadmap. |
| **`server/src/controllers/auth.controller.js`** | Auth Business Logic | Handlers for `register`, `login`, `demoLogin`, and `getProfile`. Hashes passwords with bcrypt. |
| **`server/src/controllers/decision.controller.js`** | Decision Logic Controller | Handlers for CRUD, cloning, on-demand MCDA, Monte Carlo simulations, and CSV data ingestion. |
| **`server/src/routes/api.js`** | Master API Router | Mounts `/api/health`, `/api/auth`, and `/api/decisions`. |
| **`server/src/routes/auth.routes.js`** | Auth Endpoints Router | Defines `/register`, `/login`, `/demo-login`, and `/me`. |
| **`server/src/routes/decision.routes.js`** | Decision Endpoints Router | Defines authenticated endpoints for decisions, simulation, analysis, and file uploads. |
| **`server/test/decision-engine.test.js`** | Engine Automated Tests | Built-in `node:test` suite verifying TOPSIS math, Monte Carlo percentiles, Tornado swings, and XAI outputs. |
| **`server/test/api-integration.test.js`** | API Automated Integration Tests | Built-in `node:test` suite verifying JWT auth, Zod failures, decision endpoints, and CSV parsing. |

---

## 📦 ROOT & MONOREPO FILES
> Orchestration, documentation, and shared repository scripts.

| File Path | Role | Description |
| :--- | :--- | :--- |
| **`package.json`** | Monorepo Workspace Root | Defines npm workspaces (`server`, `client`) and concurrent scripts (`npm run dev`, `dev:server`, `dev:client`, `build`). |
| **`README.md`** | Comprehensive Project Documentation | Full documentation covering platform features, mathematical foundations, quickstart, and test commands. |
| **`ARCHITECTURE_SEPARATION.md`** | Architectural Tier Separation Guide | High-level architectural breakdown, sequence diagrams, security boundaries, and independent deployment guides. |
| **`FILE_MAP.md`** | File Classification Reference (This File) | Exhaustive file-by-file categorization between Frontend and Backend tiers. |

---

## 🔒 Golden Rule of Separation

1. **Frontend (`/client`) NEVER imports from `/server`**:
   - The frontend is completely decoupled. It communicates strictly via HTTP JSON requests (`/api/*`).
   - The browser never sees database credentials, hashing salts, or JWT private keys.
2. **Backend (`/server`) NEVER imports from `/client`**:
   - The backend is a headless API service. It does not know or care how the frontend renders DOM elements.
   - It can be deployed on a different server, port, or cloud provider without changing a single line of backend logic.
