# 🚀 Render Deployment Guide | Stratagem AI Backend

The entire backend has been consolidated into **one single, self-contained file**: [`server/server.js`](file:///c:/Users/shanm/Downloads/build%20to%20ship%20project/server/server.js) (and mirrored at root [`server.js`](file:///c:/Users/shanm/Downloads/build%20to%20ship%20project/server.js)).

This eliminates complex multi-folder import paths and makes deploying to **Render Web Services** effortless.

---

## 📋 What is Included in `server.js`
Everything needed to run the entire backend is contained in this single file:
- **Express API & CORS Middleware**
- **TOPSIS & MCDA Decision Engine**
- **Monte Carlo 1,000–10,000 Trial Stochastic Engine**
- **Sensitivity & Tornado Tipping-Point Analyzer**
- **Explainable AI (XAI) Synthesis Core**
- **Google Gemini GenAI SDK (`@google/genai`) Integration**
- **Supabase PostgreSQL Connector + Atomic Local Storage Fallback**
- **JWT Authentication & bcrypt Password Hashing**
- **Zod Request Validation Schemas**
- **CSV & JSON Parameter Ingestion Engine**

---

## 🛠️ How to Deploy on Render (Step-by-Step)

### Option 1: Deploy with Root Directory set to `server` (Recommended)

1. Go to [dashboard.render.com](https://dashboard.render.com) and click **"New +"** -> **"Web Service"**.
2. Connect your GitHub repository: `https://github.com/mdabdulhameed-dev/Desicion-Intelligence-AI`.
3. Configure the following fields:
   - **Name**: `stratagem-ai-backend` (or your choice)
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js` (or `npm start`)
4. **Environment Variables**:
   Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render will set this automatically, or keep 5000) |
   | `JWT_SECRET` | `stratagem-decision-intelligence-jwt-secret-2025-secure-key` |
   | `CORS_ORIGIN` | `*` (or your frontend Render URL) |
   | `SUPABASE_URL` | `https://grrmlngbpcwrfnbhqboj.supabase.co` |
   | `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
   | `GEMINI_API_KEY` | `your-gemini-api-key-here` |

5. Click **"Deploy Web Service"**.

---

### Option 2: Deploy from the Project Root

If you leave the **Root Directory** empty in Render:
- **Build Command**: `npm install`
- **Start Command**: `node server.js` (or `npm start`)

---

## 🔍 Verification After Deployment

Once Render displays **"Live"**, verify your service by navigating to:
```text
https://your-service-name.onrender.com/api/health
```

Expected JSON response:
```json
{
  "status": "ok",
  "service": "Stratagem AI Decision Intelligence Platform (Render Standalone)",
  "timestamp": "2026-10-13T07:16:31.718Z",
  "version": "1.0.0",
  "geminiActive": true,
  "supabaseActive": true
}
```
