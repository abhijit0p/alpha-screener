# AlphaScreener India 🚀

A high-probability swing trading pipeline and dashboard for Indian equities (NSE). AlphaScreener combines quantitative technical filters (EMA trend alignment, Relative Strength vs. Nifty 50, and ATR volatility bands) with real-time AI catalyst verification via Google Gemini 2.5 Flash and Google Search Grounding.

---

## ⚡ Key Features

* **Multi-Factor Quantitative Filter:**
* **Trend Alignment:** $\text{CMP} > \text{EMA}_{20} > \text{EMA}_{50}$.
* **Momentum Band:** 14-period RSI contained between 50 and 75.
* **Volume Expansion:** Current volume $\ge 1.2\times$ the 20-day rolling volume average.
* **Relative Strength (RS):** 1-month equity return strictly outperforming the Nifty 50 benchmark (`^NSEI`).


* **Dynamic Risk Management:**
* Stop-loss: $\text{CMP} - 1.5 \times \text{ATR}_{14}$.
* Target: $\text{CMP} + 3.0 \times \text{ATR}_{14}$ (Fixed 1:2 Risk-to-Reward ratio).


* **AI Fundamental & Risk Verification:**
* Google Gemini 2.5 Flash with live Google Search Grounding audits exchange filings, quarterly earnings momentum, and order inflows.
* Filters out corporate governance red flags, SEBI scrutiny, and promoter pledges.


* **Full-Stack Serverless Architecture:**
* **Backend / Cloud Functions:** Node.js 22 engine deployed on Google Cloud Functions (`asia-south1`).
* **Database:** Cloud Firestore for real-time document synchronization.
* **Frontend:** React + Vite dashboard deployed to Firebase Hosting.



---

## 📁 Repository Structure

```text
alpha-screener/
├── backend/
│   ├── engine.js              # Technical screening math & Gemini Search grounding
│   ├── index.js               # Cloud Function trigger & CLI entrypoint
│   ├── package.json
│   └── serviceAccountKey.json # (Ignored in Git) Firebase Admin Credentials
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Live reactive dashboard & on-demand trigger
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── firebase.json              # Firebase Cloud Functions & Hosting config
├── .firebaserc                # Firebase project aliases
└── .gitignore

```

---

## 🛠️ Setup & Installation

### 1. Prerequisites

* Node.js v20+ / v22+
* Firebase CLI installed (`npm install -g firebase-tools`)
* Google AI Studio API Key ([aistudio.google.com](https://aistudio.google.com/))
* Firebase Project with Cloud Firestore enabled in `asia-south1 (Mumbai)`

---

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
npm install

```


2. Create a `.env` file in `backend/.env`:
```env
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere

```


3. Download your Firebase Admin private key:
* Go to **Firebase Console** $\rightarrow$ **Project Settings** $\rightarrow$ **Service accounts**.
* Click **Generate new private key**.
* Rename the downloaded file to `serviceAccountKey.json` and place it inside `backend/`.


4. Run the scanner locally:
```bash
npm start

```



---

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
npm install

```


2. Create a `.env` file in `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=alpha-screener-c5516.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=alpha-screener-c5516
VITE_FIREBASE_STORAGE_BUCKET=alpha-screener-c5516.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

```


3. Run locally:
```bash
npm run dev

```



---

## 🚀 Deployment

### Deploy Backend Cloud Function

From the root directory:

```bash
firebase deploy --only functions

```

### Deploy Frontend to Firebase Hosting

From the root directory:

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting

```

---

## 🔒 Security Notice

Never commit `.env` files or `serviceAccountKey.json` to version control. The root `.gitignore` is pre-configured to exclude sensitive credentials, environment files, and local build artifacts.
