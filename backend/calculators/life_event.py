"""
ARIA — Life Event Advisor Calculator
Deterministic logic for common life event financial decisions.
"""

def analyze_life_event(event, amount, annual_income, tax_bracket, risk_profile, existing_portfolio):
    # Assessment logic based on event type
    # 1. Tax Impact
    tax_rate = float(tax_bracket.replace('%','')) / 100 if '%' in tax_bracket else 0.3
    potential_tax = 0
    if event in ["Got a Bonus", "Job Change / Promotion", "Starting a Business", "ESOP / RSU Vesting"]:
        potential_tax = amount * tax_rate
    
    # 2. Allocation Strategy (Deterministic Recommendations)
    # Strategy: Emergency Fund first, then High-interest Debt, then Goals.
    
    # 3. Emergency Fund Check
    monthly_income = annual_income / 12
    ideal_emergency = monthly_income * 6
    shortfall = max(0, ideal_emergency - (existing_portfolio * 0.2)) # Assuming 20% is liquid
    
    allocation = {
        "emergency_fund": min(amount, shortfall),
        "investments": 0,
        "tax_reserve": potential_tax
    }
    
    remaining = amount - allocation["emergency_fund"] - allocation["tax_reserve"]
    if remaining > 0:
        allocation["investments"] = remaining

    # 4. Investment Split (based on risk profile)
    EQUITY_BY_RISK = {"Conservative": 0.3, "Moderate": 0.6, "Aggressive": 0.8}
    equity_pct = EQUITY_BY_RISK.get(risk_profile, 0.6)
    
    investment_split = {
        "equity": allocation["investments"] * equity_pct,
        "debt_gold": allocation["investments"] * (1 - equity_pct)
    }

    return {
        "event": event,
        "amount": amount,
        "tax_impact": {
            "estimated_tax": potential_tax,
            "net_amount": amount - potential_tax
        },
        "allocation": allocation,
        "investment_split": investment_split,
        "risk_profile": risk_profile,
        "emergency_fund_status": "Secure" if shortfall == 0 else f"Shortfall: {shortfall:,.0f}"
    }
