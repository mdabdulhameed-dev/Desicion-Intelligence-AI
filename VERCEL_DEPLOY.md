# ⚡ Vercel Deployment Guide | Stratagem AI Frontend

Deploying the **Stratagem AI** frontend (Vite + React) to **Vercel** takes less than 2 minutes.

---

## 🛠️ Step 1: Import Project in Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and log in with GitHub.
2. Select and import your repository:  
   👉 `mdabdulhameed-dev/Desicion-Intelligence-AI`

---

## ⚙️ Step 2: Configure Project Settings

On the **"Configure Project"** screen, set:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Vite` | Auto-detected |
| **Root Directory** | Click "Edit" and choose **`client`** | **CRITICAL**: Tells Vercel where the React app lives |
| **Build Command** | `npm run build` *(default)* | Compiles to `client/dist` |
| **Output Directory** | `dist` *(default)* | Distribution bundle |
| **Install Command** | `npm install` *(default)* | Installs client dependencies |

---

## 🔑 Step 3: Add Environment Variables

Under **"Environment Variables"**, add the following 3 keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` | **Your Render backend API URL** (replace with your actual Render URL + `/api`) |
| `VITE_SUPABASE_URL` | `https://grrmlngbpcwrfnbhqboj.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdycm1sbmdicGN3cmZuYmhxYm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NTY0NDUsImV4cCI6MjEwNzQzMjQ0NX0.0OnDa96qp3G2wy4QoykXsHM6KU-scZ0TYblYFoGfC0c` | Supabase Anon public key |

> **Note on `VITE_API_BASE_URL`**:  
> In local development, the app uses Vite's proxy (`/api`). For production on Vercel, point `VITE_API_BASE_URL` to your live Render backend URL (e.g., `https://stratagem-backend.onrender.com/api`).

---

## 🚀 Step 4: Deploy

1. Click **"Deploy"**.
2. Vercel will build and launch your application in ~30 seconds.
3. Your single-page routing (e.g. `/`, `/login`, `/register`, `/workspace/...`) is pre-configured via [`client/vercel.json`](file:///c:/Users/shanm/Downloads/build%20to%20ship%20project/client/vercel.json) to prevent 404 page refresh errors.
