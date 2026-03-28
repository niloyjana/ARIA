"""
ARIA — AI-Powered Financial Advisor Backend
Supports: Google Gemini | OpenAI | Groq
Run: python backend/server.py
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load config.env from project root
ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / "config.env")

app = FastAPI(title="ARIA", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve the frontend folder ─────────────────────────────────
FRONTEND = ROOT / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND)), name="static")

@app.get("/")
def serve_index():
    return FileResponse(str(FRONTEND / "index.html"))

@app.get("/{path:path}")
def serve_pages(path: str):
    full = FRONTEND / path
    if full.exists():
        return FileResponse(str(full))
    return FileResponse(str(FRONTEND / "index.html"))


# ── AI Client ─────────────────────────────────────────────────

def ask_ai(prompt: str) -> str:
    provider = os.getenv("AI_PROVIDER", "local").lower()
    
    if provider == "local":
        import openai
        base_url = os.getenv("LOCAL_API_BASE", "http://localhost:11434/v1")
        model = os.getenv("LOCAL_MODEL", "llama3")
        try:
            client = openai.OpenAI(base_url=base_url, api_key="ollama")
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
            )
            return resp.choices[0].message.content
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Local Model Error ({base_url}): {str(e)}")
            
    elif provider == "groq":
        from groq import Groq
        key = os.getenv("GROQ_API_KEY", "")
        if not key or key == "paste_your_groq_key_here":
            raise HTTPException(status_code=500, detail="Please set GROQ_API_KEY in config.env. Get a free key at https://console.groq.com")
        client = Groq(api_key=key)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
        )
        return resp.choices[0].message.content
    else:
        raise HTTPException(status_code=500, detail=f"Unknown AI_PROVIDER: {provider}")


# ── Request Models ────────────────────────────────────────────

class FIRERequest(BaseModel):
    age: int
    monthly_income: float
    monthly_expenses: float
    existing_investments: float = 0
    retirement_age: int
    goals: str

class HealthRequest(BaseModel):
    monthly_income: float
    emergency_fund: float
    term_insurance_cr: float
    health_insurance_l: float
    total_investments: float
    total_debt: float
    annual_tax_saving: float

class LifeEventRequest(BaseModel):
    event: str
    amount: float
    annual_income: float
    tax_bracket: str
    risk_profile: str
    existing_portfolio: float = 0

class TaxRequest(BaseModel):
    basic_salary_monthly: float
    hra_monthly: float
    rent_paid_monthly: float
    city_type: str
    existing_80c: float
    home_loan_interest: float
    nps_contribution: float

class CoupleRequest(BaseModel):
    p1_monthly_income: float
    p2_monthly_income: float
    p1_hra_monthly: float
    p2_hra_monthly: float
    rent_paid_monthly: float
    combined_investments: float
    joint_goals: str

class XRayRequest(BaseModel):
    portfolio_text: str
    investment_horizon: str
    risk_profile: str
    monthly_sip: float
    primary_goal: str

class AdviceResponse(BaseModel):
    advice: str


# ── Prompts ───────────────────────────────────────────────────

def fire_prompt(r):
    savings = r.monthly_income - r.monthly_expenses
    return f"""You are an expert Indian CFP specializing in FIRE (Financial Independence, Retire Early).

User: Age {r.age}, Retire at {r.retirement_age} ({r.retirement_age - r.age} years left)
Monthly Income: ₹{r.monthly_income:,.0f} | Expenses: ₹{r.monthly_expenses:,.0f} | Saves: ₹{savings:,.0f}/mo
Existing Investments: ₹{r.existing_investments:,.0f}
Goals: {r.goals}

Write a complete FIRE roadmap with these sections:
## FIRE Number
Calculate exact corpus needed using 4% rule. Show math.

## Monthly Investment Target
How much to invest monthly assuming 12% CAGR. Gap from current savings.

## SIP Allocation Plan
| Fund Category | Monthly SIP (₹) | % |
(Large Cap Index, Flexi Cap, Mid Cap, ELSS, Debt)

## Asset Allocation by Age
Age-wise equity/debt split from now to retirement.

## Insurance Gaps
Term life (ideal = 15-20x annual income) and health insurance recommendations.

## Tax-Saving Moves
80C gap, NPS 80CCD(1B), HRA, 80D with exact ₹ amounts.

## Emergency Fund
Target = 6 months expenses. Where to park it.

## 5-Year Milestones
Year-by-year net worth targets.

Be specific with ₹ amounts and Indian product names.

Use this format for charts when relevant:
```chart-json
{{
  "type": "line",
  "label": "Wealth Projection (₹ Lakhs)",
  "data": {{ "Yr 1": 2, "Yr 5": 15, "Yr 10": 45, "Yr 15": 110, "Yr 20": 250 }}
}}
```
Include a second pie chart for asset allocation.
```chart-json
{{
  "type": "pie",
  "label": "Suggested Asset Allocation",
  "data": {{ "Equity": 70, "Debt": 20, "Gold": 10 }}
}}
```"""

def health_prompt(r):
    em = r.emergency_fund / (r.monthly_income * 0.6) if r.monthly_income else 0
    return f"""You are a certified Indian financial planner doing a wellness audit.

Monthly Income: ₹{r.monthly_income:,.0f}
Emergency Fund: ₹{r.emergency_fund:,.0f} ({em:.1f} months)
Term Insurance: ₹{r.term_insurance_cr} Crore | Health Insurance: ₹{r.health_insurance_l} Lakh
Total Investments: ₹{r.total_investments:,.0f} | Total Debt: ₹{r.total_debt:,.0f}
Annual 80C Investments: ₹{r.annual_tax_saving:,.0f}

## OVERALL MONEY HEALTH SCORE: [X]/100

Score each 0-100:
### 🛡️ Emergency Preparedness: [X]/100
### 🏥 Insurance Coverage: [X]/100
### 📈 Investment Diversification: [X]/100
### 💳 Debt Health: [X]/100
### 🧾 Tax Efficiency: [X]/100
### 🏖️ Retirement Readiness: [X]/100

## Top 3 Immediate Actions
## Quick Wins (This Week)

Use Indian benchmarks. Be specific with ₹ gaps.

IMPORTANT: Start your response with the Overall Score in this exact format:
[85]/100: Overall Money Health Score

Also include a breakdown chart:
```chart-json
{{
  "type": "bar",
  "label": "Health Dimensions",
  "data": {{ "Emergency": 80, "Insurance": 60, "Investments": 70, "Debt": 90, "Tax": 50 }}
}}
```"""

def life_event_prompt(r):
    return f"""You are India's top financial advisor for life events.

Event: {r.event} | Amount: ₹{r.amount:,.0f}
Annual Income: ₹{r.annual_income:,.0f} | Tax Bracket: {r.tax_bracket} | Risk: {r.risk_profile}
Existing Portfolio: ₹{r.existing_portfolio:,.0f}

## Situation Analysis
## Immediate Actions (First 30 Days)
## Smart Money Allocation
| Bucket | Amount (₹) | % | Product |
## Tax Implications & How to Minimise
## Investment Strategy ({r.risk_profile})
## Common Mistakes to Avoid
## 6-Month Roadmap

Be specific to Indian tax laws FY2024-25.

Include an allocation chart:
```chart-json
{{
  "type": "pie",
  "label": "Money Allocation Plan",
  "data": {{ "Emergency": 20, "Long-term": 50, "Short-term": 30 }}
}}
```"""

def tax_prompt(r):
    annual = r.basic_salary_monthly * 12
    gap = max(0, 150000 - r.existing_80c)
    return f"""You are a CA expert in Indian income tax FY2024-25.

Basic: ₹{r.basic_salary_monthly:,.0f}/mo | HRA: ₹{r.hra_monthly:,.0f}/mo | Rent: ₹{r.rent_paid_monthly:,.0f}/mo
City: {r.city_type} | 80C invested: ₹{r.existing_80c:,.0f} | Home Loan Interest: ₹{r.home_loan_interest:,.0f}
NPS: ₹{r.nps_contribution:,.0f}

## Old Regime vs New Regime Comparison
| Component | Old Regime | New Regime |
Show full tax calculation with final tax liability for both.

## Verdict: Which saves more and by exactly ₹[X]

## Deductions You're Missing
- 80C gap: ₹{gap:,.0f} remaining
- 80CCD(1B) NPS extra: ₹50,000
- 80D health insurance
- HRA exemption calculation
- Any others applicable

## Tax-Saving Products Ranked
| Product | Invest (₹) | Tax Saved (₹) | Lock-in | Risk |

## March-End Checklist

Include a comparison chart:
```chart-json
{{
  "type": "bar",
  "label": "Tax Liability Comparison (₹)",
  "data": {{ "Old Regime": 125000, "New Regime": 95000 }}
}}
```"""

def couple_prompt(r):
    combined = r.p1_monthly_income + r.p2_monthly_income
    return f"""You are India's leading couples' financial advisor.

P1: ₹{r.p1_monthly_income:,.0f}/mo income, ₹{r.p1_hra_monthly:,.0f}/mo HRA
P2: ₹{r.p2_monthly_income:,.0f}/mo income, ₹{r.p2_hra_monthly:,.0f}/mo HRA
Combined: ₹{combined:,.0f}/mo | Rent: ₹{r.rent_paid_monthly:,.0f}/mo
Investments: ₹{r.combined_investments:,.0f} | Goals: {r.joint_goals}

## HRA Optimization — Who claims? Exact tax savings for each scenario.
## 80C Split Strategy — How to split ₹3L limit optimally
## NPS Joint Strategy
## Insurance Architecture — Joint floater vs separate
## SIP Split for Tax Efficiency
| Goal | Total SIP | P1 | P2 | Reason |
## Monthly Budget Blueprint (₹{combined:,.0f})
## Combined Net Worth Tracker — What to track"""

def xray_prompt(r):
    return f"""You are a SEBI-registered MF analyst.

Portfolio:
{r.portfolio_text}

SIP: ₹{r.monthly_sip:,.0f}/mo | Horizon: {r.investment_horizon} | Risk: {r.risk_profile} | Goal: {r.primary_goal}

## Portfolio Breakdown
| Fund | Category | Value (₹) | % |

## Category Allocation vs Ideal
| Category | Current % | Ideal % | Status |

## Overlap Analysis — top stocks repeated across funds

## Expense Ratio Drag
| Fund | Expense Ratio | Annual Cost (₹) |

## Portfolio Health Score: [X]/10

## Rebalancing Plan
🔴 EXIT | 🟡 REDUCE | 🟢 INCREASE | ➕ ADD

## Projected Corpus at {r.investment_horizon}
Conservative / Moderate / Optimistic CAGR scenarios

Include a breakdown chart of current portfolio:
```chart-json
{{
  "type": "pie",
  "label": "Portfolio Sector Allocation",
  "data": {{ "Technology": 30, "Finance": 25, "Healthcare": 15, "Consumer": 20, "Others": 10 }}
}}
```
If NAV data was provided in the input, use it to calculate exact growth gaps.
"""


# ── Market Sentiment Helper ──────────────────────────────────

def fetch_market_data():
    import requests
    symbols = {"NIFTY 50": "%5ENSEI", "SENSEX": "%5EBSESN"}
    headers = {'User-Agent': 'Mozilla/5.0'}
    results = []
    total_pct = 0
    
    for name, sym in symbols.items():
        try:
            r = requests.get(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}", headers=headers, timeout=5)
            data = r.json()['chart']['result'][0]['meta']
            price = data['regularMarketPrice']
            prev_close = data['chartPreviousClose']
            change = price - prev_close
            pct = (change / prev_close) * 100
            total_pct += pct
            results.append({
                "name": name,
                "price": f"{price:,.2f}",
                "change": f"{change:+.2f}",
                "percent": f"{pct:+.2f}%",
                "trend": "up" if pct >= 0 else "down"
            })
        except:
            results.append({"name": name, "price": "---", "change": "0.00", "percent": "0.00%", "trend": "neutral"})

    # Calculate Sentiment based on average of Nifty and Sensex
    import random
    avg_pct = total_pct / 2
    score = max(5, min(95, 50 + (avg_pct * 10) + random.uniform(-2, 2)))
    
    if score > 70: mood = "Greed"
    elif score > 55: mood = "Optimistic"
    elif score < 30: mood = "Extreme Fear"
    elif score < 45: mood = "Fearful"
    else: mood = "Neutral"

    return {
        "indices": results,
        "mood": mood,
        "score": int(score)
    }

# ── Endpoints ─────────────────────────────────────────────────

@app.get("/api/market-mood")
def market_mood():
    return fetch_market_data()

@app.get("/api/status")
def status():
    provider = os.getenv("AI_PROVIDER", "local").upper()
    return {"status": "ok", "provider": provider}

@app.post("/api/fire", response_model=AdviceResponse)
def fire(r: FIRERequest):
    return AdviceResponse(advice=ask_ai(fire_prompt(r)))

@app.post("/api/health", response_model=AdviceResponse)
def health(r: HealthRequest):
    return AdviceResponse(advice=ask_ai(health_prompt(r)))

@app.post("/api/life-event", response_model=AdviceResponse)
def life_event(r: LifeEventRequest):
    return AdviceResponse(advice=ask_ai(life_event_prompt(r)))

@app.post("/api/tax", response_model=AdviceResponse)
def tax(r: TaxRequest):
    return AdviceResponse(advice=ask_ai(tax_prompt(r)))

@app.post("/api/couple", response_model=AdviceResponse)
def couple(r: CoupleRequest):
    return AdviceResponse(advice=ask_ai(couple_prompt(r)))

@app.post("/api/xray", response_model=AdviceResponse)
def xray(r: XRayRequest):
    return AdviceResponse(advice=ask_ai(xray_prompt(r)))


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "localhost")
    port = int(os.getenv("API_PORT", 8000))
    provider = os.getenv("AI_PROVIDER", "local").upper()
    print(f"\n✅ ARIA backend running!")
    print(f"   Provider : {provider}")
    print(f"   API Docs : http://{host}:{port}/docs")
    print(f"   Frontend : http://{host}:{port}/\n")
    uvicorn.run("server:app", host=host, port=port, reload=True)
