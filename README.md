# 🌌 ARIA — The Smart AI Financial Advisor

> **Status:** Premium UI/UX Overhaul Complete | **Local AI:** Integrated (Ollama)

**ARIA** (formerly AI Money Mentor) is a professional-grade, privacy-first financial advisory platform. It combines the power of large language models (LLMs) with a structured financial framework to replace expensive human advisors with precision AI intelligence.

![ARIA Dashboard Preview](https://github.com/niloyjana/aria.ai/blob/main/frontend/assets/preview.png?raw=true) *(Note: Add your actual screenshot here!)*

---

## ✨ Key Features

### 🏦 Specialized AI Toolsets
- **🔥 FIRE Path Planner**: A complete roadmap to Financial Independence and Early Retirement.
- **💯 Money Health Score**: 6-dimension wellness audit (Emergency fund, Life/Health Insurance, 80C, Debt).
- **🧾 Tax Wizard**: Intelligence engine for Old vs New regime comparison and deduction discovery.
- **💑 Couple's Money Planner**: Optimize HRA, NPS, and SIPs across joint households.
- **🔬 Portfolio X-Ray**: Deep mutual fund analysis (Overlap, expense drag, rebalancing).
- **🎯 Life Event Advisor**: Targeted advice for bonus, marriage, inheritance, or new babies.

### 🛡️ Privacy-First Architecture
Unlike general-purpose chatbots, ARIA is built for **Local AI Support**. Your sensitive financial data (Net Worth, Income, Goals) remains on your machine when using the **Ollama** backend.

### 🎨 Premium "AI Product" Design
- **Glassmorphism UI**: Frosted glass effects, glowing borders, and a deep purple-black palette.
- **Responsive Sidebar**: Collapses into a sleek icon-rail with smart tooltips.
- **Interactive Dashboard**: Modern SVG-based visuals and data-rich summary cards.
- **Subtle Micro-animations**: Animated background particles and scroll-reveal effects.

---

## 🛠️ Project Structure

```
aria.ai/
├── backend/
│   └── server.py        ← FastAPI logic & Financial Prompt Engineering
├── frontend/
│   ├── index.html       ← Core Dashboard & Sidebar UI
│   ├── css/style.css    ← Premium Design System (CSS3)
│   └── js/
│       ├── tools.js     ← Tool Form Definitions & Logic
│       └── main.js      ← UI & Animation Controller
├── config.env           ← AI Provider & Local Model Config
├── requirements.txt     ← Python dependencies
└── README.md
```

---

## 🚀 Setup & Installation (3 Steps)

### 1. Environment Setup
Clone the repo and install the Python backend requirements:
```powershell
pip install -r requirements.txt
```

### 2. Configure AI Provider
Open `config.env` and choose your intelligence:

**Option A: Local AI (Recommended for Privacy)**
1. Install [Ollama](https://ollama.com).
2. Run `ollama run llama3.2:1b`.
3. Set `AI_PROVIDER=local` in `config.env`.

**Option B: Groq (Cloud Fallback - Ultra Fast)**
1. Get a key from [Groq Console](https://console.groq.com).
2. Set `AI_PROVIDER=groq` and paste your `GROQ_API_KEY`.

### 3. Launch ARIA
Start the FastAPI server:
```powershell
# Navigate to backend folder
cd backend
python server.py
```
Visit **`http://localhost:8000`** in your browser.

---

## 🧪 Tech Stack
- **Backend**: Python 3.10+, FastAPI, Uvicorn.
- **AI Engine**: Local LLMs (Ollama/Llama 3.2) or Cloud APIs (Groq).
- **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), JavaScript (ES6+).
- **Animations**: CSS Keyframes, Intersection Observer API.

---

## ⚠️ Disclaimer
ARIA is for educational and informational purposes only. It is not a SEBI-registered investment advisor. Always consult a qualified professional before making major financial decisions.

---

*Designed & Developed as a Premium AI Product Experiment.* 🌌
