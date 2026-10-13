# Stratagem AI | Frontend Application Tier (`/client`)

This folder contains the **Frontend Single-Page Application (SPA)** for the Stratagem AI Decision Intelligence platform.

---

## 🎨 Role & Responsibilities
- **Runs on**: Client Web Browser (Chrome, Firefox, Safari, Edge)
- **Local Dev Server**: `http://localhost:3000` (via Vite)
- **Tech Stack**: React 18, Vite 6, Tailwind CSS, Recharts, React Router, Axios, Lucide Icons
- **Core Goal**: Render high-fidelity visual interfaces, present multi-criteria analytics (Radar charts, Area probability curves, Tornado bars), capture user inputs and CSV uploads, and manage client-side authentication tokens.

---

## 📁 Internal Directory Structure

```
client/
├── public/                    # Static browser assets (icons, favicons)
├── src/
│   ├── api/                   # HTTP communication layer
│   │   └── client.js          # Axios client with JWT Bearer token interceptor
│   │
│   ├── context/               # Global React state
│   │   └── AuthContext.jsx    # Session management, login, logout, and demo auth
│   │
│   ├── pages/                 # Full-page route views
│   │   ├── Login.jsx          # Sign-in view with 1-click Demo Login
│   │   ├── Register.jsx       # Analyst registration view
│   │   ├── Dashboard.jsx      # Scenario catalog & KPI stat cards
│   │   └── DecisionWorkspace.jsx # Comprehensive 5-tab Decision Intelligence Studio
│   │
│   ├── components/            # Reusable UI & Visual Analytics components
│   │   ├── Navbar.jsx         # Top navigation & engine status badge
│   │   ├── StatCard.jsx       # Glowing metric summary cards
│   │   ├── DecisionRadarChart.jsx # Recharts multi-criteria radar chart
│   │   ├── MonteCarloDistributionChart.jsx # Recharts probability density curves
│   │   ├── TornadoChart.jsx   # Recharts sensitivity horizontal bar chart
│   │   ├── SensitivitySliders.jsx # Live "What-If" interactive weight simulator
│   │   ├── IngestModal.jsx    # CSV upload, paste, & template ingestion wizard
│   │   ├── NewDecisionModal.jsx # Multi-criteria scenario builder
│   │   └── ExplainableBriefModal.jsx # Executive brief export & print view
│   │
│   ├── App.jsx                # Router configuration & ProtectedRoute session guards
│   ├── index.css              # Tailwind CSS directives, glassmorphism, and dark theme
│   └── main.jsx               # React DOM bootstrap entrypoint
│
├── .env                       # Frontend environment variables (VITE_API_BASE_URL)
├── .env.example               # Template for frontend environment variables
├── index.html                 # HTML host document mounting <div id="root">
├── package.json               # Frontend dependencies & Vite scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind design tokens, typography, and shadows
└── vite.config.js             # Bundler config & dev proxy rules to port 5000
```

---

## 🚀 How to Run the Frontend Independently

```bash
# From the project root:
npm run dev:client

# Or from inside the client/ directory:
cd client
npm run dev
```

The frontend will start at **`http://localhost:3000`**.  
During local development, API calls to `/api/*` are automatically reverse-proxied to `http://localhost:5000` via `vite.config.js`.

---

## 📦 Production Build

```bash
npm run build --workspace=client
```

Output is emitted into `client/dist/`. This is 100% static HTML, CSS, and minified JS that can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront).
