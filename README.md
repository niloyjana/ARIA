# 💰 ARIA — AI-Powered Financial Advisor
### India's AI-powered personal finance advisor

---

## 📁 Project Structure

```
money_mentor/
├── backend/
│   └── server.py        ← FastAPI backend (Python)
├── frontend/
│   ├── index.html       ← Main webpage
│   ├── css/style.css    ← Styling
│   └── js/
│       ├── tools.js     ← Tool definitions
│       └── main.js      ← App logic
├── config.env           ← ⭐ PUT YOUR API KEY HERE
├── requirements.txt
└── README.md
```

---

## 🚀 Setup (Windows — 3 steps)

### Step 1 — Install packages

Open PowerShell in this folder and run:
```
pip install -r requirements.txt
```

### Step 2 — Add your API key

Open `config.env` in Notepad.

**For Google Gemini (free):**
1. Go to https://aistudio.google.com → Sign in → "Get API Key"
2. Set `AI_PROVIDER=gemini`
3. Paste key next to `GEMINI_API_KEY=`

**For OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Set `AI_PROVIDER=openai`
3. Paste key next to `OPENAI_API_KEY=`

**For Groq (free & fast):**
1. Go to https://console.groq.com
2. Set `AI_PROVIDER=groq`
3. Paste key next to `GROQ_API_KEY=`

### Step 3 — Run it

Open PowerShell in this folder:
```
cd backend
python server.py
```

Then open your browser and go to:
```
http://localhost:8000
```

That's it! The frontend opens in your browser. ✅

---

## 🤖 6 AI Tools

| Tool | What it does |
|------|-------------|
| 🔥 FIRE Planner | Complete retirement roadmap with SIPs & asset allocation |
| 💯 Money Health Score | 6-dimension financial wellness score |
| 🎯 Life Event Advisor | Bonus, marriage, inheritance — what to do with money |
| 🧾 Tax Wizard | Old vs new regime comparison + missed deductions |
| 💑 Couple Planner | Optimize HRA, NPS, SIPs across both incomes |
| 🔬 Portfolio X-Ray | MF overlap, expense drag, rebalancing plan |

---

## ❓ Troubleshooting

**"pip is not recognized"** → Install Python from https://python.org (check "Add to PATH")

**"Cannot find path requirements.txt"** → Make sure you're in the `money_mentor` folder, not inside `backend`

**Page doesn't load** → Make sure `python server.py` is still running in PowerShell

**AI gives error** → Check your API key is correctly pasted in `config.env`

---

⚠️ For educational purposes only. Not SEBI-registered investment advice.
