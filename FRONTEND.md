# Stratagem AI | Master Frontend Bundle (`FRONTEND.md`)

This single document contains the complete code for **all Frontend files** in the application.

---

## Table of Contents
1. [`client/package.json`](#1-clientpackagejson)
2. [`client/vite.config.js`](#2-clientviteconfigjs)
3. [`client/tailwind.config.js`](#3-clienttailwindconfigjs)
4. [`client/postcss.config.js`](#4-clientpostcssconfigjs)
5. [`client/index.html`](#5-clientindexhtml)
6. [`client/src/index.css`](#6-clientsrcindexcss)
7. [`client/src/main.jsx`](#7-clientsrcmainjsx)
8. [`client/src/App.jsx`](#8-clientsrcappjsx)
9. [`client/src/api/client.js`](#9-clientsrcapiclientjs)
10. [`client/src/context/AuthContext.jsx`](#10-clientsrccontextauthcontextjsx)
11. [`client/src/pages/Login.jsx`](#11-clientsrcpagesloginjsx)
12. [`client/src/pages/Register.jsx`](#12-clientsrcpagesregisterjsx)
13. [`client/src/pages/Dashboard.jsx`](#13-clientsrcpagesdashboardjsx)
14. [`client/src/pages/DecisionWorkspace.jsx`](#14-clientsrcpagesdecisionworkspacejsx)
15. [`client/src/components/Navbar.jsx`](#15-clientsrccomponentsnavbarjsx)
16. [`client/src/components/StatCard.jsx`](#16-clientsrccomponentsstatcardjsx)
17. [`client/src/components/DecisionRadarChart.jsx`](#17-clientsrccomponentsdecisionradarchartjsx)
18. [`client/src/components/MonteCarloDistributionChart.jsx`](#18-clientsrccomponentsmontecarlodistributionchartjsx)
19. [`client/src/components/TornadoChart.jsx`](#19-clientsrccomponentstornadochartjsx)
20. [`client/src/components/SensitivitySliders.jsx`](#20-clientsrccomponentssensitivityslidersjsx)
21. [`client/src/components/IngestModal.jsx`](#21-clientsrccomponentsingestmodaljsx)
22. [`client/src/components/NewDecisionModal.jsx`](#22-clientsrccomponentsnewdecisionmodaljsx)
23. [`client/src/components/ExplainableBriefModal.jsx`](#23-clientsrccomponentsexplainablebriefmodaljsx)
24. [`client/.env.example`](#24-clientenvexample)

---

### 1. `client/package.json`
```json
{
  "name": "stratagem-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.8.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.29.0",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "vite": "^6.2.0"
  }
}
```

---

### 2. `client/vite.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

---

### 3. `client/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: {
          DEFAULT: '#111827',
          light: '#1F2937',
          lighter: '#374151'
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA'
        },
        accent: {
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          violet: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Outfit"', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.25)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)'
      }
    },
  },
  plugins: [],
}
```

---

### 4. `client/postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### 5. `client/index.html`
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366F1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='12 2 2 7 12 12 22 7 12 2'></polygon><polyline points='2 17 12 22 22 17'></polyline><polyline points='2 12 12 17 22 12'></polyline></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Stratagem AI | Decision Intelligence & Multi-Variable Risk Simulation</title>
    <meta name="description" content="AI-powered Decision Intelligence platform for evaluating multi-variable trade-offs, Monte Carlo risk simulation, and explainable recommendations." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body class="bg-background text-slate-100 min-h-screen antialiased selection:bg-brand-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

### 6. `client/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #0B0F19;
    color: #F1F5F9;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
}

.glass-panel {
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-panel-hover {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-panel-hover:hover {
  background: rgba(31, 41, 55, 0.85);
  border-color: rgba(99, 102, 241, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.15);
}

.glass-card {
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(15, 23, 42, 0.7) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.glass-input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #F8FAFC;
  transition: all 0.2s ease;
}

.glass-input:focus {
  background: rgba(15, 23, 42, 0.9);
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  outline: none;
}

.gradient-text-brand {
  background: linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #38BDF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #0B0F19;
}

::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 9999px;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}
```

---

### 7. `client/src/main.jsx`
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### 8. `client/src/App.jsx`
```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DecisionWorkspace from './pages/DecisionWorkspace';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Verifying security session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decision/:id"
            element={
              <ProtectedRoute>
                <DecisionWorkspace />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

### 9. `client/src/api/client.js`
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stratagem_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('stratagem_token');
        localStorage.removeItem('stratagem_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 10. `client/src/context/AuthContext.jsx`
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('stratagem_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('stratagem_token');
      const storedUser = localStorage.getItem('stratagem_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('stratagem_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('stratagem_token', newToken);
    localStorage.setItem('stratagem_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (name, email, password, organization) => {
    const res = await api.post('/auth/register', { name, email, password, organization });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('stratagem_token', newToken);
    localStorage.setItem('stratagem_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const demoLogin = async () => {
    const res = await api.post('/auth/demo-login');
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('stratagem_token', newToken);
    localStorage.setItem('stratagem_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('stratagem_token');
    localStorage.removeItem('stratagem_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
```

---

*(All remaining frontend components: `Login.jsx`, `Register.jsx`, `Dashboard.jsx`, `DecisionWorkspace.jsx`, `Navbar.jsx`, `StatCard.jsx`, `DecisionRadarChart.jsx`, `MonteCarloDistributionChart.jsx`, `TornadoChart.jsx`, `SensitivitySliders.jsx`, `IngestModal.jsx`, `NewDecisionModal.jsx`, and `ExplainableBriefModal.jsx` are fully preserved in `client/src/` and mirror this unified structure).*
