# 🤖 Google Gemini AI Integration Guide

Stratagem AI Decision Intelligence is integrated with the official **Google Gen AI SDK (`@google/genai`)**, bringing Gemini 2.5 Flash, 2.0 Flash, and 1.5 Flash models to enterprise multi-variable decision evaluation.

---

## 🔑 1. How to Obtain a Free Google Gemini API Key

1. Go to **Google AI Studio**:  
   👉 [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google Account.
3. Click **"Create API key"** (or **"Get API key"**).
4. Select or create a Google Cloud Project and copy your newly generated key (`AIzaSy...`).

---

## ⚡ 2. Two Ways to Connect Your API Key

### Method A: Through the Web Application UI (Instant & Zero Restart)
1. Open the Stratagem AI web application at `http://localhost:3000`.
2. Open any decision scenario (e.g., *Cloud Infrastructure Migration*).
3. Click the **"Executive AI Brief"** button in the top right.
4. Switch to the **"Google Gemini AI Brief"** tab.
5. Paste your Gemini API key into the input field and click **"Save & Connect"**.
6. The platform validates your key with Google's live servers in real time, persists it safely to your backend, and immediately generates the synthesis!

---

### Method B: Directly in your `.env` File
1. Open [`server/.env`](file:///c:/Users/shanm/Downloads/build%20to%20ship%20project/server/.env) in your editor.
2. Locate the **Google Gemini AI Configuration** section:
   ```env
   # ===================================================================
   # GOOGLE GEMINI AI CONFIGURATION:
   # (Obtain free API key from https://aistudio.google.com/app/apikey)
   # ===================================================================
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```
3. Paste your key and save the file.
4. Verify the connection from your terminal:
   ```bash
   npm run test:gemini --workspace=server
   ```

---

## 🧪 3. Verification & Diagnostic Commands

Test your connection at any time using the built-in diagnostic test runner:

```bash
# From the project root:
npm run test:gemini --workspace=server

# Or from inside the server directory:
cd server
npm run test:gemini
```

### Successful Connection Output:
```text
===========================================================
🤖 Stratagem AI: Google Gemini Connection Verification
===========================================================
Detected Key: AIzaSy...4xQ1
Contacting Google Gemini API...
Status: ✅ CONNECTED & OPERATIONAL
Model Handshake: gemini-2.5-flash
Test Ping Reply: "Operational"
Gemini Executive Brief & AI Strategic Assistant features are fully enabled!
===========================================================
```

---

## 🧠 4. Features Powered by Gemini in Stratagem AI

| Feature | Description | Engine / Model |
| :--- | :--- | :--- |
| **Neural Executive Synthesis** | Converts mathematical TOPSIS vector normalization and Euclidean distance separations into an authoritative, narrative decision brief with conviction scores. | `gemini-2.5-flash` |
| **Stochastic Downside Mitigation** | Translates Monte Carlo P10 downside floors and 95% VaR into concrete operational and financial hedging strategies. | `gemini-2.5-flash` |
| **Vulnerability & Switch Warnings** | Interprets sensitivity tornado weight swing thresholds, providing alerts before key decision parameters flip. | `gemini-2.5-flash` |
| **Phased Strategic Roadmap** | Auto-generates a phased 30 / 60 / 90-day rollout plan tailored to the winning alternative's profile. | `gemini-2.5-flash` |
| **Decision Intelligence Assistant (Q&A)** | Enables decision architects to ask arbitrary "what-if" strategic questions about the decision model with live context. | `gemini-2.5-flash` |

---

## 📡 5. Backend AI API Endpoints

All endpoints are mounted under `/api/ai`:

- `GET /api/ai/status` — Checks if Gemini is configured and lists candidate models.
- `POST /api/ai/test-key` — Validates an API key against Google's live servers.
- `POST /api/ai/save-key` *(Authenticated)* — Persists and activates an API key.
- `POST /api/ai/decision/:id/brief` *(Authenticated)* — Generates an executive brief synthesized with Gemini.
- `POST /api/ai/decision/:id/ask` *(Authenticated)* — Context-aware Q&A assistant for the decision model.
