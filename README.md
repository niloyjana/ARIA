<div align="center">

# 🌌 ARIA <br> <span style="font-size: 0.6em; color: gray;">The Smart Multi-Agent AI Financial Advisor v3.0</span>

[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)]()
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla_JS_|_CSS3-f7df1e.svg?logo=javascript)]()
[![AI Integration](https://img.shields.io/badge/AI-Ollama_|_Groq-blueviolet.svg)]()

**A professional-grade, privacy-first AI financial advisory platform built for the modern individual.** 
*Combining the power of Large Language Models (LLMs) with comprehensive financial frameworks to deliver precision, personalized intelligence.*


<img width="1918" height="908" alt="Screenshot 2026-04-04 222211" src="https://github.com/user-attachments/assets/1d594308-b108-4141-a386-49adc75e71cd" />

</div>

---

## ⚡ Overview

**ARIA** is a comprehensive financial planner disguised as an intuitive web app. It replaces generic chatbot interfaces with a robust, tool-driven dashboard. Whether you're planning for early retirement (FIRE), auditing your life insurance, or optimizing your couples' finances, ARIA provides tailored, actionable advice using local or cloud-based AI models.

### 🛡️ Privacy-First Architecture
Your financial data is sensitive. Unlike cloud-only generic tools, ARIA natively supports **Local LLMs** via Ollama. You can run all calculations, inputs, and inference completely offline on your own machine. For unmatched speed and convenience, it also features a seamless fallback to top-tier cloud APIs like **Groq**.

---

## ✨ Key Features & Toolsets

ARIA provides a suite of specialized calculators and advisors, accessible via a sleek, interactive dashboard:

### 🏦 Financial Intelligence Tools
- **🔥 FIRE Path Planner:** Receive a strategic roadmap to achieve Financial Independence and Early Retirement based on your savings rate.
- **💯 Money Health Score:** A 6-dimensional wellness audit (Emergency fund balances, Life/Health coverage adequacy, 80C optimizations, Debt-to-Income).
- **🧾 Tax Wizard:** An intelligent engine to compare Old vs. New tax regimes and discover hidden deduction opportunities.
- **💑 Couple's Planner:** Co-manage household finances. Optimize joint HRA, NPS distributions, and concurrent SIPs.
- **🔬 Portfolio X-Ray:** Deep mutual fund and equity analysis covering overlap risks, expense ratio drag, and custom rebalancing alerts.
- **🎯 Life Event Advisor:** Hyper-targeted guidance for massive life milestones (receiving a bonus, marriage, inheritance, having a child).
- **🕵️ Multi-Agent Intelligence (v3.0):** A coordinated reasoning chain where specialized agents (Auditor, Market Specialist, Manager) collaborate to audit your documents and formulate strategic advice.
- **📊 Financial Insights:** Automated pattern discovery across your transactions with month-over-month trend analysis and spending rankings.

### 🎨 Premium "AI Product" UI/UX
- **Glassmorphism Aesthetic:** Stunning frosted glass effects, glowing interactive borders, and a sophisticated deep purple-black palette.
- **Responsive Dynamic Sidebar:** Collapses gracefully into a sleek SVG icon-rail with intelligent tooltips to maximize workspace density.
- **Modern Interactions:** Smooth CSS-driven micro-animations, animated background particles, and scroll-reveal elements ensuring a fluid user experience.


<img width="1919" height="909" alt="Screenshot 2026-04-04 224533" src="https://github.com/user-attachments/assets/0ebcbe40-e2f0-42ae-ab4b-31dda189b623" />

<img width="1919" height="891" alt="Screenshot 2026-04-04 224331" src="https://github.com/user-attachments/assets/f4711140-a3b0-4fc8-9e22-6c2f5f4d3da1" />

---
## 🛠️ Project Structure

Clean separation of frontend interface and backend intelligent routing:

```text
ARIA/
├── backend/
│   ├── server.py              # FastAPI logic & API endpoints
│   ├── agents_orchestrator.py # Multi-Agent reasoning engine
│   ├── rag_engine.py          # Vector store & RAG retrieval
│   ├── database.py            # SQLite state persistence
│   └── ...
├── frontend/
│   ├── index.html             # Core Dashboard Layout & Navigation
│   ├── css/
│   │   └── style.css          # Premium Custom Design System (CSS3)
│   ├── js/
│   │   ├── main.js            # UI Controller & SPA Router
│   │   ├── transactions.js    # Ledger & Analysis Logic
│   │   └── ...
├── config.env                 # Environment Variables
├── requirements.txt           # Dependency Manifest
├── start.py                   # Bootstrapper
└── README.md
```

---

## 🚀 Setup & Installation

Get your local ARIA instance running in three simple steps:

### 1. Environment Setup

Clone the repository and install the backend dependencies. Python 3.10+ is recommended.

```powershell
git clone https://github.com/niloyjana/ARIA.git
cd ARIA
pip install -r requirements.txt
```

### 2. Configure Your AI Provider

Open the `config.env` file in the root directory and choose your intelligence engine:

#### Option A: Local AI (Privacy-First & Recommended)
1. Download and install [Ollama](https://ollama.com).
2. Download your preferred model *(e.g., Llama 3 8B or Llama 3.2 1B)*:
   ```powershell
   ollama run llama3.2:1b
   ```
3. In `config.env`, set your provider to local:
   ```env
   AI_PROVIDER=local
   MODEL_NAME=llama3.2:1b
   ```

#### Option B: Groq (Cloud Fallback - Ultra Fast)
1. Obtain an API key from the [Groq Console](https://console.groq.com).
2. In `config.env`, set your provider and key:
   ```env
   AI_PROVIDER=groq
   GROQ_API_KEY=your_api_key_here
   ```

### 3. Launch ARIA

Boot up the ARIA server with a single command:

```powershell
python start.py
# Server will start typically at http://localhost:8000
```
Open up **`http://localhost:8000`** in your browser and start planning your financial future!
Open up **`http://localhost:8000`** in your browser and start planning your financial future!

---

## 🧪 Tech Stack Overview

- **Backend Protocol:** `Python 3.10+`, `FastAPI`, `Uvicorn`
- **AI Inference Engine:** Local (`Ollama`) / Cloud (`Groq`, `OpenAI`, `Google Generative AI` SDKs included)
- **Frontend Architecture:** `Vanilla HTML5`, `Modern CSS3` (Custom Theme System), `JavaScript (ES6+)`
- **UX Ecosystem:** CSS Keyframes, Intersection Observer API, SVG DOM Injection

---

## ⚠️ Disclaimer

**ARIA is designed strictly for educational and informational purposes.** It operates on probabilistic LLMs and is **not** a SEBI-registered investment advisor or a certified financial planner. Always consult a qualified, registered financial professional before making major investment, tax, or life decisions based on AI-generated advice.


