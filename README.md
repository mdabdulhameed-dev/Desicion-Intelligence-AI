# Stratagem AI | Autonomous Decision Intelligence & Risk Simulation Platform

Stratagem AI is a production-ready Full-Stack Decision Intelligence Platform designed to ingest fragmented multi-variable data, calculate optimal trade-offs via **TOPSIS** and **MCDA**, simulate stochastic risk distributions using **Monte Carlo** models, analyze parameter sensitivity with **Tornado charts**, and generate transparent, explainable AI executive briefs.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Criteria Decision Analysis (MCDA Core)
- **TOPSIS Algorithm (Technique for Order of Preference by Similarity to Ideal Solution)**:
  - Vector normalization: $r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^m x_{kj}^2}}$
  - Weighted normalized matrix: $v_{ij} = w_j \cdot r_{ij}$
  - Positive ($A^+$) and Negative ($A^-$) Ideal Solutions for Benefit vs. Cost criteria
  - Euclidean Separation Distances: $S_i^+ = \sqrt{\sum (v_{ij} - v_j^+)^2}$ and $S_i^- = \sqrt{\sum (v_{ij} - v_j^-)^2}$
  - Relative Closeness: $C_i^* = \frac{S_i^-}{S_i^+ + S_i^-} \times 100$
- **Weighted Sum Model (WSM)**: Linear min-max normalization baseline.
- **Pareto Optimality Detection**: Identifies strictly non-dominated solutions on multi-dimensional trade-off curves.

### 2. Stochastic Monte Carlo Risk Engine
- Runs 1,000 to 10,000 randomized market iterations per scenario.
- Perturbs criteria values across uncertainty intervals using **Triangular** and **Gaussian (Box-Muller)** distributions.
- Calculates:
  - **Dominance / Win Probability (%)** across all trials.
  - **Percentile Distributions**: P10 (Downside Floor), P50 (Median), P90 (Upside Ceiling).
  - **Value at Risk (VaR 95%)** and Volatility Standard Deviation.
  - Generates 14-bin frequency density curves for Recharts area visualizers.

### 3. Sensitivity & Tornado Analysis
- Perturbs criteria weights across a 0.1x to 3.0x spectrum.
- Calculates score swing volatility for each criterion.
- Detects **Critical Switching Thresholds** (identifies the exact weight percentage shift that flips the #1 ranked recommendation to another alternative).

### 4. Explainable AI (XAI) Synthesis
- Generates natural-language trade-off deconstructions:
  - **Primary Strategic Advantages**: Where the top alternative outperforms competitors.
  - **Accepted Trade-Off Compromises**: Honest identification of criteria deficits.
  - **Phased Strategic Action Plan**: Actionable 30/60/90-day implementation roadmap.

### 5. Fragmented Data Ingestion
- Upload CSV files or paste CSV/JSON parameters directly.
- Automatic heuristic classification of benefit vs. cost criteria (cost, latency, capex, price, risk vs. throughput, compliance, security).

### 6. Security & Validation
- **JWT Authentication** with password hashing using **bcryptjs**.
- Strict request payload validation using **Zod** across all backend routes.
- Persistent file-backed JSON store with atomic writes.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
Clone the repository and install all workspace dependencies:
```bash
npm install
```

### Running Locally
Run both the backend Express server and the Vite React frontend concurrently:
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

### Instant Demo Credentials
For 1-click evaluation without registering:
- **Email**: `demo@stratagem.ai`
- **Password**: `StratagemDemo2025!`
*(Or click the "Explore as Chief Decision Architect" button on the login screen)*

---

## 🧪 Automated Test Suite
Run backend unit and integration tests:
```bash
npm test --workspace=server
```

Suite covers:
1. MCDA TOPSIS calculation correctness and Pareto verification.
2. Monte Carlo stochastic simulation and percentile bounds.
3. Sensitivity Tornado swing calculation.
4. Explainable AI synthesis.
5. Auth JWT & Bcrypt password security.
6. Zod schema validation.
7. Fragmented CSV data ingestion.
