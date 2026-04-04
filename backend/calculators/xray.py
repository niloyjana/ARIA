"""
ARIA — Portfolio X-Ray Calculator
Deterministic logic for mutual fund portfolio analysis.
"""
import re

def analyze_portfolio(portfolio_text, horizon, risk_profile, monthly_sip):
    # Parse portfolio text: "Fund Name - ₹Amount" or "Fund Name ₹Amount"
    lines = portfolio_text.split('\n')
    extracted = []
    total_value = 0
    
    for line in lines:
        if not line.strip(): continue
        # 1. Clean line and find all numbers
        clean_line = line.replace(",", "")
        nums = re.findall(r"[\d]+\.?\d*", clean_line)
        if nums:
            amt = float(nums[-1])
            # 2. Extract name by splitting or by stripping the amount from the end
            if '-' in line:
                name = line.split('-', 1)[0].strip()
            elif '₹' in line:
                name = line.split('₹', 1)[0].strip()
            else:
                # Fallback: remove the last number (amount) from the line to get the name
                amount_str = nums[-1]
                name = clean_line.rsplit(amount_str, 1)[0].strip()
                # Clean up any trailing non-alphanumeric chars
                name = re.sub(r'[:\s]+$', '', name)
            
            extracted.append({"name": name, "amount": amt})
            total_value += amt

    # Category Mapping (Deterministic logic using hardcoded data for demonstration)
    # In a real app, this would use a database of fund categories.
    CATEGORIES = {
        "Flexi Cap": ["parag parikh", "quant flexi", "hdfc flexi", "axis flexi", "mirae flexi", "nippon flexi"],
        "Large Cap": ["axis bluechip", "mirae large", "sbi bluechip", "canara robeco bluechip", "hdfc top 100"],
        "Mid Cap": ["axis midcap", "quant midcap", "kotak midcap", "hdfc midcap", "dsp midcap"],
        "Small Cap": ["quant small", "nippon small", "axis small", "sbi small"],
        "Debt": ["liquid", "overnight", "money market", "short term", "arbitrage"]
    }
    
    # Map and calculate total per category
    category_totals = {cat: 0 for cat in CATEGORIES}
    category_totals["Others"] = 0
    
    for item in extracted:
        matched = False
        lower_name = item["name"].lower()
        for cat, kws in CATEGORIES.items():
            if any(k in lower_name for k in kws):
                category_totals[cat] += item["amount"]
                matched = True
                break
        if not matched:
            category_totals["Others"] += item["amount"]

    # Overlap Analysis (Simulation)
    # Higher overlap if multiple funds in the same category
    overlap_score = 0
    for cat, val in category_totals.items():
        if val > 0:
            count = sum(1 for f in extracted if any(k in f["name"].lower() for k in CATEGORIES.get(cat, [])))
            if count > 1: overlap_score += (count - 1) * 20 # 20% penalty per extra fund in same category
    overlap_score = min(100, overlap_score)

    # Expense Ratio (Simulation)
    # Average 0.8% for direct, 1.8% for regular (assuming 1.2% avg for demo)
    expense_drag_yearly = total_value * 0.012
    
    # Ideal Allocation Check
    EQUITY_BY_RISK = {"Conservative": 0.4, "Moderate": 0.7, "Aggressive": 0.9}
    ideal_equity = EQUITY_BY_RISK.get(risk_profile, 0.7)
    
    current_equity = (total_value - category_totals["Debt"]) / total_value if total_value > 0 else 0
    rebalance_needed = abs(current_equity - ideal_equity) > 0.1

    return {
        "total_value": total_value,
        "fund_count": len(extracted),
        "category_breakdown": {k: {"amount": v, "pct": (v/total_value*100) if total_value > 0 else 0} for k, v in category_totals.items()},
        "overlap_score": overlap_score,
        "expense_drag_yearly": expense_drag_yearly,
        "risk_analysis": {
            "profile": risk_profile,
            "ideal_equity_pct": ideal_equity * 100,
            "current_equity_pct": current_equity * 100,
            "rebalance_needed": rebalance_needed
        },
        "extracted_funds": extracted
    }
