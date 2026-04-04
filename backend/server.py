"""
ARIA — AI-Powered Financial Advisor Backend v2.0 (Hardened)
All deterministic math runs in calculators/. AI explains results only.
Supported Tools: FIRE, Health, Tax, Couple, X-Ray, Life Event.
"""

import os, sys, json
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(Path(__file__).parent))
load_dotenv(ROOT / "config.env")

# ── DB + Calculators ──────────────────────────────────────────────────────────
from rag_engine             import engine
from database               import init_db
from calculators.networth   import calculate_networth, get_networth_trend
from services.market_data_service import market_service
from services.ingestion_service   import ingestion_service

init_db()

# ── Startup Validation ────────────────────────────────────────────────────────
AI_PROVIDER = os.getenv("AI_PROVIDER", "local").lower()
if AI_PROVIDER == "groq":
    key = os.getenv("GROQ_API_KEY", "")
    if not key or "paste_your_groq_key_here" in key:
        print("\n" + "!"*60)
        print("⚠️  CRITICAL CONFIGURATION ERROR: GROQ_API_KEY is missing!")
        print("   If you want to use Groq AI, add your key to 'config.env'.")
        print("   Otherwise, set AI_PROVIDER=local in 'config.env'.")
        print("!"*60 + "\n")

def lakhs(n: float) -> str:
    """Format number in Indian lakhs/crores."""
    if n >= 10_000_000:
        return f"₹{n/10_000_000:.2f} Cr"
    if n >= 100_000:
        return f"₹{n/100_000:.2f} L"
    return f"₹{n:,.0f}"

app = FastAPI(title="ARIA", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

FRONTEND = ROOT / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND)), name="static")
app.mount("/css", StaticFiles(directory=str(FRONTEND / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(FRONTEND / "js")), name="js")

@app.get("/")
def serve_index(): return FileResponse(str(FRONTEND / "index.html"))


# ── AI Client ─────────────────────────────────────────────────────────────────

_local_ai_client = None

def get_local_ai_client():
    global _local_ai_client
    if _local_ai_client is None:
        import openai
        _local_ai_client = openai.OpenAI(
            base_url=os.getenv("LOCAL_API_BASE", "http://localhost:11434/v1"),
            api_key="ollama"
        )
    return _local_ai_client

async def ask_ai(prompt: str) -> str:
    provider = os.getenv("AI_PROVIDER", "local").lower()
    messages = [{"role": "user", "content": prompt}]
    
    if provider == "groq":
        import httpx
        key = os.getenv("GROQ_API_KEY", "")
        if not key or key == "paste_your_groq_key_here":
            raise HTTPException(500, "Set GROQ_API_KEY in config.env")
        
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "max_tokens": 2000
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"❌ AI connection error: {str(e)}")
            raise HTTPException(500, f"AI advice generation failed: {str(e)}")
    elif provider == "local":
        import asyncio
        client = get_local_ai_client()
        
        def call_sync():
            resp = client.chat.completions.create(
                model=os.getenv("LOCAL_MODEL", "llama3"),
                messages=messages, max_tokens=2000,
            )
            return resp.choices[0].message.content
            
        return await asyncio.to_thread(call_sync)
    raise HTTPException(500, f"Unknown AI_PROVIDER: {provider}")


# ── Request Models ────────────────────────────────────────────────────────────

class FIRERequest(BaseModel):
    age: int; monthly_income: float; monthly_expenses: float
    existing_investments: float = 0; retirement_age: int; goals: str = ""

class HealthRequest(BaseModel):
    monthly_income: float; emergency_fund: float; term_insurance_cr: float
    health_insurance_l: float; total_investments: float; total_debt: float
    annual_tax_saving: float

class TaxRequest(BaseModel):
    basic_salary_monthly: float; hra_monthly: float; rent_paid_monthly: float
    city_type: str; existing_80c: float; home_loan_interest: float
    nps_contribution: float

class CoupleRequest(BaseModel):
    p1_monthly_income: float; p2_monthly_income: float
    p1_hra_monthly: float; p2_hra_monthly: float
    rent_paid_monthly: float; combined_investments: float; joint_goals: str

class XRayRequest(BaseModel):
    portfolio_text: str; investment_horizon: str; risk_profile: str
    monthly_sip: float; primary_goal: str

class LifeEventRequest(BaseModel):
    event: str; amount: float; annual_income: float
    tax_bracket: str; risk_profile: str; existing_portfolio: float = 0

class NetWorthRequest(BaseModel):
    assets: float; liabilities: float; notes: str = ""

class RiskProfileRequest(BaseModel):
    # Behavioral answers
    investment_horizon: int # years
    reaction_to_market_drop: str # "buy more", "hold", "sell some", "sell all"
    primary_goal: str # "wealth growth", "balanced", "capital preservation", "income"
    prior_experience: str = "moderate"
    income_stability: str = "stable"

class AdvisorChatRequest(BaseModel):
    message: str

class AdviceResponse(BaseModel):
    advice: str

class AdvisorChatResponse(BaseModel):
    response: str

class Transaction(BaseModel):
    amount: float
    category: str
    type: str
    date: str

class ExpenseRequest(BaseModel):
    transactions: list[Transaction]

class PortfolioAssetRequest(BaseModel):
    asset_name: str
    asset_type: str # equity, mutual_fund, crypto, bond, gold, cash
    ticker: str = ""
    quantity: float
    avg_price: float
    current_price: float
    sector: str = "Other"

# ── AI Prompts (calculators pre-fill the numbers) ─────────────────────────────

def fire_prompt(r: FIRERequest, c) -> str:
    milestone_data = dict(zip(c.milestone_labels, c.milestone_values))
    chart_line = json.dumps({"type": "line", "label": "Portfolio Growth (₹ Lakhs)", "data": milestone_data})
    chart_pie  = json.dumps({"type": "pie",  "label": "Suggested Asset Allocation",
                              "data": {"Equity": 70 - max(0, (r.age - 30) * 2), "Debt": 20 + max(0, (r.age - 30) * 2), "Gold": 10}})
    status = "✅ Your savings EXCEED requirements!" if c.sip_achievable else f"⚠️ Shortfall of ₹{c.sip_gap:,.0f}/month"
    return f"""You are an expert Indian CFP. The math is already calculated — do NOT change these numbers:
FIRE Analysis:
• FIRE Number (4% rule): {lakhs(c.fire_number)} | Annual expenses ₹{r.monthly_expenses*12:,.0f} × 25
• Required SIP: ₹{c.required_monthly_sip:,.0f}/month | Current savings: ₹{c.current_monthly_savings:,.0f}/month
• {status}
Include these EXACT chart blocks:
```chart-json
{chart_line}
```
```chart-json
{chart_pie}
```
## FIRE Number
## Monthly Investment Target
## Portfolio Roadmap
## Quick Actions"""

def health_prompt(r: HealthRequest, c) -> str:
    dims = c.dimensions
    chart = json.dumps({"type": "bar", "label": "Health Dimensions (out of 100)",
                         "data": {d.name.split()[0]: d.score for d in dims.values()}})
    return f"""You are a certified Indian financial planner. Overall Score: {c.overall_score}/100 ({c.grade}).
Include this EXACT chart:
```chart-json
{chart}
```
## Score: {c.overall_score}/100
## Top Actions to improve:
{chr(10).join(f"- {a}" for a in c.top_actions)}"""

def tax_prompt(r: TaxRequest, c) -> str:
    old, new = c.old_regime, c.new_regime
    chart = json.dumps({"type": "bar", "label": "Tax Comparison (₹)",
                         "data": {"Old": int(old.total_tax), "New": int(new.total_tax)}})
    return f"""You are a CA. Verdict: {c.recommended} wins.
Include this EXACT chart:
```chart-json
{chart}
```
## Verdict: {c.recommended} saves ₹{c.savings:,.0f}
## Deductions Missing
## Tax Checklist"""

def couple_prompt(r: CoupleRequest, c) -> str:
    chart = json.dumps({"type": "pie", "label": "Joint Goal Allocation",
                         "data": {"P1 Share": c["sip_strategy"]["p1_share"], "P2 Share": c["sip_strategy"]["p2_share"]}})
    return f"""You are a couples' financial advisor. Combined Income: ₹{c['combined_income']:,.0f}/mo.
Winner for HRA: {c['hra_optimization']['winner']} (₹{c['hra_optimization']['max_exemption']:,.0f}).
Include this EXACT chart:
```chart-json
{chart}
```
## Combined Strategy
## HRA Optimization
## Joint SIP Allocation"""

def xray_prompt(r: XRayRequest, c) -> str:
    chart = json.dumps({"type": "pie", "label": "Detected Allocation",
                         "data": {k: v["pct"] for k,v in c["category_breakdown"].items() if v["pct"] > 0}})
    return f"""You are a MF analyst. Portfolio Value: ₹{c['total_value']:,.0f}.
Overlap Score: {c['overlap_score']}/100. Overlap Penalty: {c['overlap_score']}%.
Include this EXACT chart:
```chart-json
{chart}
```
## Portfolio Breakdown
## Overlap & Efficiency
## Action Plan"""

def life_event_prompt(r: LifeEventRequest, c) -> str:
    chart = json.dumps({"type": "pie", "label": "Allocation Plan", "data": c["allocation"]})
    return f"""You are a financial advisor for life events. Event: {c['event']} (₹{c['amount']:,.0f}).
Allocation: Tax ₹{c['allocation']['tax_reserve']:,.0f} | Emergency ₹{c['allocation']['emergency_fund']:,.0f} | Invest ₹{c['allocation']['investments']:,.0f}.
Include this EXACT chart:
```chart-json
{chart}
```
## Situation Analysis
## Smart Money Moves
## Risk & Roadmap"""

def portfolio_prompt(c: dict) -> str:
    chart = json.dumps({"type": "pie", "label": "Portfolio Allocation", "data": c["allocation"]})
    perf = c["performance"]
    div = c["diversification"]
    
    return f"""You are the ARIA Portfolio Strategist.
Portfolio Value: {lakhs(c['portfolio_value'])}
Invested: {lakhs(perf['invested_value'])}
Total Return: {perf['return_pct']}% (₹{perf['profit']:,.0f})
Diversification Score: {div['score']}/100 ({div['category']})

Include this EXACT chart:
```chart-json
{chart}
```

## Portfolio Health Snapshot
## Strengths & Weaknesses
## Optimization & Rebalancing Advice
Only interpret the provided numbers. Keep advice professional and empathetic."""

def expense_prompt(analysis: dict) -> str:
    top_cats = "\n".join([f"- {c['category']}: ₹{c['amount']:,.0f}" for c in analysis["top_categories"]])
    largest = f"{analysis['largest_expense'].get('category', 'N/A')} (₹{analysis['largest_expense'].get('amount', 0):,.0f} on {analysis['largest_expense'].get('date', 'N/A')})"
    
    return f"""You are ARIA, a professional financial advisor. 
Analyze the following spending report.

Income: ₹{analysis['income']:,.0f}
Expenses: ₹{analysis['expenses']:,.0f}
Savings Rate: {analysis['savings_rate']}%

Top Spending Categories:
{top_cats}

Largest Expense:
{largest}

Provide:
• Spending behavior analysis
• Financial health insights
• Suggestions to improve savings

The AI should only interpret results, not compute them. Keep it professional and empathetic."""



# ── API Endpoints: 6 Core Tools ───────────────────────────────────────────────

@app.get("/api/status")
def status(): return {"status": "ok", "version": "2.0.0"}

@app.get("/api/market-mood")
async def get_market_mood():
    """Live Market Mood derived from actual global index data."""
    try:
        ticker_data = await market_service.get_global_ticker()
        
        # Calculate average change % across all tracked indices
        changes = []
        for t in ticker_data:
            try:
                changes.append(float(t['change'].replace('%', '').replace('+', '')))
            except (ValueError, KeyError):
                pass
        
        avg_change = sum(changes) / len(changes) if changes else 0.0
        
        if avg_change > 1.0:
            mood = "Extreme Greed"
        elif avg_change > 0.3:
            mood = "Greed"
        elif avg_change > -0.3:
            mood = "Neutral"
        elif avg_change > -1.0:
            mood = "Fear"
        else:
            mood = "Extreme Fear"
        
        # Format indices for ticker display
        indices = []
        name_map = {"S&P 500": "S&P 500", "NASDAQ": "NASDAQ", "DAX": "DAX", 
                    "NIFTY 50": "NIFTY 50", "FTSE 100": "FTSE 100", "NIKKEI 225": "NIKKEI"}
        for t in ticker_data:
            change_str = t.get('change', '0.0%')
            trend = 'up' if change_str.startswith('+') else ('down' if change_str.startswith('-') else 'neutral')
            indices.append({
                "name": t.get('name', ''),
                "price": t.get('value', 'N/A'),
                "trend": trend,
                "change": change_str,
                "percent": change_str
            })
        
        return {"mood": mood, "indices": indices}
    
    except Exception as e:
        # Graceful fallback if yfinance is unavailable
        return {
            "mood": "Neutral",
            "indices": [
                {"name": "NIFTY 50", "price": "—", "trend": "neutral", "change": "0.00", "percent": "0.00%"},
                {"name": "SENSEX", "price": "—", "trend": "neutral", "change": "0.00", "percent": "0.00%"},
            ]
        }

@app.post("/api/fire", response_model=AdviceResponse)
async def fire(r: FIRERequest):
    from calculators.fire import calculate_fire
    calc = calculate_fire(r.age, r.retirement_age, r.monthly_income, r.monthly_expenses, r.existing_investments)
    return AdviceResponse(advice=await ask_ai(fire_prompt(r, calc)))

@app.post("/api/health", response_model=AdviceResponse)
async def health(r: HealthRequest):
    from calculators.health import calculate_health_score
    calc = calculate_health_score(r.monthly_income, r.emergency_fund, r.term_insurance_cr, r.health_insurance_l,
                                   r.total_investments, r.total_debt, r.annual_tax_saving)
    return AdviceResponse(advice=await ask_ai(health_prompt(r, calc)))

@app.post("/api/tax", response_model=AdviceResponse)
async def tax(r: TaxRequest):
    from calculators.tax import compare_tax_regimes
    city = "Metro" if "Metro" in r.city_type else "Non-Metro"
    calc = compare_tax_regimes(r.basic_salary_monthly, r.hra_monthly, r.rent_paid_monthly, city, r.existing_80c, r.home_loan_interest, r.nps_contribution)
    return AdviceResponse(advice=await ask_ai(tax_prompt(r, calc)))

@app.post("/api/couple", response_model=AdviceResponse)
async def couple(r: CoupleRequest):
    from calculators.couple import calculate_couple_plan
    calc = calculate_couple_plan(r.p1_monthly_income, r.p2_monthly_income, r.p1_hra_monthly, r.p2_hra_monthly, r.rent_paid_monthly, r.combined_investments, r.joint_goals)
    return AdviceResponse(advice=await ask_ai(couple_prompt(r, calc)))

@app.post("/api/xray", response_model=AdviceResponse)
async def xray(r: XRayRequest):
    from calculators.xray import analyze_portfolio
    calc = analyze_portfolio(r.portfolio_text, r.investment_horizon, r.risk_profile, r.monthly_sip)
    return AdviceResponse(advice=await ask_ai(xray_prompt(r, calc)))

@app.post("/api/life-event", response_model=AdviceResponse)
async def life_event(r: LifeEventRequest):
    from calculators.life_event import analyze_life_event
    calc = analyze_life_event(r.event, r.amount, r.annual_income, r.tax_bracket, r.risk_profile, r.existing_portfolio)
    return AdviceResponse(advice=await ask_ai(life_event_prompt(r, calc)))

@app.post("/api/expense/analyze")
async def analyze_expenses(r: ExpenseRequest):
    from services.expense.expense_analyzer import ExpenseAnalysisService
    
    # 1. Convert Pydantic models to list of dicts
    txns = [t.dict() for t in r.transactions]
    
    # 2. Run Deterministic Logic
    analysis = ExpenseAnalysisService.analyze(txns)
    
    # 3. Handle Empty Case
    if not analysis.get("top_categories"):
        return {
            "analysis": analysis,
            "ai_explanation": "No transaction data available for analysis."
        }
    
    # 4. Ask AI for explanation
    explanation = await ask_ai(expense_prompt(analysis))
    
    return AdviceResponse(advice=explanation)


# ── Net Worth Tracker ────────────────────────────────────────────────────────

@app.post("/api/networth")
def add_networth_entry(r: NetWorthRequest):
    if r.assets < 0 or r.liabilities < 0:
        raise HTTPException(400, "Invalid financial values: Assets and Liabilities must be >= 0")
    
    # 1. Calculate
    calc = calculate_networth(r.assets, r.liabilities)
    nw = calc["net_worth"]
    
    # 2. Persist
    from database import get_conn
    with get_conn() as conn:
        # Save Entry
        conn.execute(
            "INSERT INTO net_worth_entries (assets, liabilities, net_worth, notes) VALUES (?, ?, ?, ?)",
            (r.assets, r.liabilities, nw, r.notes)
        )
        # Log Event
        conn.execute(
            "INSERT INTO system_logs (event, details) VALUES (?, ?)",
            ("networth_entry_created", json.dumps({"assets": r.assets, "liabilities": r.liabilities, "net_worth": nw}))
        )
    
    summary = f"Net Worth logged: ₹{nw:,.0f}. Assets: ₹{r.assets:,.0f} | Liabilities: ₹{r.liabilities:,.0f}"
    return AdviceResponse(advice=summary)

@app.get("/api/networth")
def get_networth_history():
    from database import get_conn
    with get_conn() as conn:
        rows = conn.execute("SELECT timestamp, assets, liabilities, net_worth, notes FROM net_worth_entries ORDER BY timestamp ASC").fetchall()
        history = [dict(row) for row in rows]
    
    trend = get_networth_trend(history)
    return trend

# ── Risk Profile Analyzer ──────────────────────────────────────────────────

@app.post("/api/risk-profile/analyze")
def analyze_risk_profile(r: RiskProfileRequest):
    from database import get_conn
    from calculators.risk_analyzer import calculate_risk_profile
    
    # 1. Fetch Internal Financial Data (Latest Net Worth)
    with get_conn() as conn:
        latest_nw = conn.execute("SELECT assets, liabilities FROM net_worth_entries ORDER BY timestamp DESC LIMIT 1").fetchone()
        
    if not latest_nw:
        raise HTTPException(400, "Net worth must be calculated before risk analysis (No history found)")
    
    financial_data = {
        "total_assets": latest_nw["assets"],
        "total_liabilities": latest_nw["liabilities"],
        "savings_rate": 20, # Default if not tracked yet
        "emergency_fund_months": 3 # Default if not tracked yet
    }
    
    # 2. Run Analysis
    profile = calculate_risk_profile(r.dict(), financial_data)
    
    # 3. Store Result
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO risk_profiles (risk_score, risk_category, behavior_answers, financial_snapshot) 
            VALUES (?, ?, ?, ?)
        """, (profile["risk_score"], profile["risk_category"], json.dumps(r.dict()), json.dumps(financial_data)))
        
    return profile

@app.get("/api/risk-profile")
def get_risk_profile():
    from database import get_conn
    with get_conn() as conn:
        row = conn.execute("SELECT risk_score, risk_category, behavior_answers, financial_snapshot, updated_at FROM risk_profiles ORDER BY updated_at DESC LIMIT 1").fetchone()
    
    if not row:
        raise HTTPException(404, "No risk profile found")
    
    return dict(row)

@app.post("/api/risk-profile/recalculate")
def recalculate_risk_profile():
    from database import get_conn
    from calculators.risk_analyzer import calculate_risk_profile
    
    # 1. Get Latest Behavior + Assets
    with get_conn() as conn:
        prev = conn.execute("SELECT behavior_answers FROM risk_profiles ORDER BY updated_at DESC LIMIT 1").fetchone()
        latest_nw = conn.execute("SELECT assets, liabilities FROM net_worth_entries ORDER BY timestamp DESC LIMIT 1").fetchone()
        
    if not prev or not latest_nw:
        raise HTTPException(400, "Incomplete data for recalculation")
    
    behavior = json.loads(prev["behavior_answers"])
    financial_data = {
        "total_assets": latest_nw["assets"],
        "total_liabilities": latest_nw["liabilities"]
    }
    
    # 2. Re-analyze
    profile = calculate_risk_profile(behavior, financial_data)
    
    # 3. Store
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO risk_profiles (risk_score, risk_category, behavior_answers, financial_snapshot) 
            VALUES (?, ?, ?, ?)
        """, (profile["risk_score"], profile["risk_category"], json.dumps(behavior), json.dumps(financial_data)))
        
    return profile

# ── Portfolio Dashboard ───────────────────────────────────────────────────────

@app.post("/api/portfolio/dashboard", response_model=AdviceResponse)
async def get_portfolio_dashboard():
    from calculators.portfolio_dashboard import calculate_portfolio_dashboard
    calc = calculate_portfolio_dashboard()
    return AdviceResponse(advice=await ask_ai(portfolio_prompt(calc)))

@app.post("/api/portfolio/asset")
def add_portfolio_asset(r: PortfolioAssetRequest):
    from database import get_conn
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO portfolio_holdings 
            (asset_name, asset_type, ticker, quantity, avg_price, current_price, sector)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (r.asset_name, r.asset_type, r.ticker, r.quantity, r.avg_price, r.current_price, r.sector))
    return {"status": "ok", "message": f"Asset {r.asset_name} added successfully"}

@app.get("/api/portfolio/holdings")
def get_portfolio_holdings():
    from database import get_conn
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM portfolio_holdings ORDER BY created_at DESC").fetchall()
        return [dict(row) for row in rows]

@app.delete("/api/portfolio/asset/{asset_id}")
def delete_portfolio_asset(asset_id: int):
    from database import get_conn
    with get_conn() as conn:
        res = conn.execute("DELETE FROM portfolio_holdings WHERE id = ?", (asset_id,))
        if res.rowcount == 0:
            raise HTTPException(404, "Asset not found")
    return {"status": "ok", "message": "Asset deleted successfully"}

@app.get("/api/networth/summary")
def get_networth_summary():
    from database import get_conn
    with get_conn() as conn:
        rows = conn.execute("SELECT net_worth FROM net_worth_entries ORDER BY timestamp ASC").fetchall()
        if not rows:
            return {"latest_networth": 0, "average_networth": 0, "change_percentage": 0, "total_entries": 0}
        
        values = [r["net_worth"] for r in rows]
        latest = values[-1]
        avg = sum(values) / len(values)
        
        # Trend calc
        history = [{"net_worth": v} for v in values]
        trend = get_networth_trend(history)
        
        return {
            "latest_networth": latest,
            "average_networth": round(avg, 2),
            "change_percentage": trend["change_percentage"],
            "total_entries": len(values)
        }


# ── AI Advisor (RAG) ─────────────────────────────────────────────────────────

# Removed duplicate placeholder endpoint (Integrated below)

@app.post("/api/advisor/chat", response_model=AdvisorChatResponse)
async def advisor_chat(r: AdvisorChatRequest):
    # 1. Retrieve Context from RAG (includes previous interactions)
    context = engine.query(r.message)
    
    # 2. Build Prompt
    prompt = f"""You are ARIA, the ultimate AI Financial Advisor.
CONTEXT FROM DOCUMENTS AND PREVIOUS CHATS:
---
{context}
---
USER'S CURRENT REQUEST: {r.message}

MISSION: Provide professional, accurate, and empathetic financial advice. 
- Use the provided context to remember previous conversations.
- If context is missing, use your general expertise (NIFTY, 80C, etc.).
- Keep response clean with Markdown.
"""
    
    # 3. Ask AI
    response = await ask_ai(prompt)
    
    # 4. STORE INTERACTION (NEW: Memory system)
    engine.store_interaction(user_id="default_user", message=r.message, response=response)
    
    # 5. PERSIST TO DB (Audit Trial)
    try:
        from database import get_conn
        with get_conn() as conn:
            conn.execute("INSERT INTO chat_history (role, content) VALUES (?, ?)", ("user", r.message))
            conn.execute("INSERT INTO chat_history (role, content) VALUES (?, ?)", ("assistant", response))
    except Exception as db_err:
        print(f"⚠️ History logging failed: {db_err}")
    
    return AdvisorChatResponse(response=response)

from fastapi import UploadFile, File
import shutil

@app.post("/api/advisor/upload")
async def upload_document(file: UploadFile = File(...)):
    temp_dir = ROOT / "temp_uploads"
    temp_dir.mkdir(parents=True, exist_ok=True)
    file_path = temp_dir / file.filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        status = engine.process_document(str(file_path), file.filename)
        return {"status": "ok", "message": status, "doc_id": file.filename}
    except Exception as e:
        raise HTTPException(500, f"Error processing document: {str(e)}")

# ── Market Intelligence Engine (NEW) ──────────────────────────────────────────

@app.get("/api/market-data/{city}")
@app.get("/api/market/region/{city}")
async def get_market_data(city: str):
    try:
        data = await market_service.get_regional_data(city)
        
        # Simple AI Insight Generation based on fetched data
        prompt = f"""Summarize the current macro outlook for {city} based on:
        - GDP/Growth: {data.get('macro', {}).get('gdp')}, {data.get('macro', {}).get('growth')}
        - Inflation/Rate: {data.get('macro', {}).get('inflation')}, {data.get('macro', {}).get('rate')}
        - Sentiment: {data.get('sentiment')}
        Provide a 2-sentence institutional-grade summary."""
        
        try:
            data['aiOutlook'] = await ask_ai(prompt)
            data['aiOutlook'] = data['aiOutlook'].strip()
        except Exception:
            data['aiOutlook'] = "Analysis currently stabilizing based on regional liquidity data."
            
        return data
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/global-ticker")
async def get_global_ticker():
    try:
        return await market_service.get_global_ticker()
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/market-highlights")
async def get_market_highlights():
    try:
        return await market_service.get_all_hubs_data()
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/search-regions")
@app.get("/api/market/search")
async def search_regions(q: str):
    try:
        return market_service.search_regions(q)
    except Exception as e:
        raise HTTPException(500, str(e))



# ── Data Ingestion System ───────────────────────────────────────────────────

@app.post("/api/data/upload-csv")
async def upload_data_csv(file: UploadFile = File(...)):
    """Receives CSV, parses via pandas, and stores in SQLite."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Invalid file type. Please upload a .csv file.")
    
    try:
        content = await file.read()
        try:
            csv_str = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            csv_str = content.decode("latin1")
        
        if not csv_str.strip():
            raise HTTPException(400, "The CSV file is empty.")

        records = ingestion_service.parse_csv(csv_str)
        
        if not records:
             raise HTTPException(400, "ARIA couldn't extract any valid data from this CSV. Ensure headers for Date, Description, and Amount are clearly visible.")

        return JSONResponse({
            "status": "success",
            "message": f"Successfully ingested {len(records)} entries.",
            "count": len(records),
            "data": records
        })
    except ValueError as e:
        print(f"⚠️ Validation Error: {str(e)}")
        raise HTTPException(400, str(e))
    except Exception as e:
        print(f"❌ Server Error during Ingestion: {str(e)}")
        raise HTTPException(500, f"Critical ingestion error: {str(e)}")

@app.get("/api/data/processed")
def get_processed_data_view():
    """Returns cleaned + structured data for frontend.")"""
    try:
        data = ingestion_service.get_processed_data()
        return JSONResponse({"status": "success", "data": data})
    except Exception as e:
        raise HTTPException(500, str(e))


@app.delete("/api/data/transactions")
def clear_all_transactions():
    """Wipes all ingested transaction data from the database."""
    try:
        ingestion_service.clear_all_data()
        return JSONResponse({"status": "success", "message": "Ledger cleared successfully."})
    except Exception as e:
        raise HTTPException(500, str(e))

@app.delete("/api/data/transactions/{id}")
def delete_single_transaction(id: int):
    """Deletes a specific transaction by ID."""
    try:
        ingestion_service.delete_by_id(id)
        return JSONResponse({"status": "success", "message": f"Transaction {id} deleted."})
    except Exception as e:
        raise HTTPException(500, str(e))

# ── SPA / Page Router (Catch-all) ─────────────────────────────────────────────

@app.get("/{path:path}")
async def catch_all(path: str):
    # 1. API calls must NOT fall into SPA routing
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")

    # 2. Check if the exact file exists in frontend
    file_path = FRONTEND / path
    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))
    
    # 3. Fallback to index.html for SPA routing
    return FileResponse(str(FRONTEND / "index.html"))

if __name__ == "__main__":
    import uvicorn
    # host = os.getenv("API_HOST", "localhost")
    # port = int(os.getenv("API_PORT", 8080))
    print(f"\n✅ ARIA v2.0 Ready — Hardened Strategy\n")
    uvicorn.run(app, host="127.0.0.1", port=8080)
