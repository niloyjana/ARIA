"""
ARIA — Couple's Financial Planner Calculator
Deterministic logic for joint tax optimization, HRA, and goal tracking.
"""

def calculate_couple_plan(p1_income, p2_income, p1_hra, p2_hra, rent_paid, combined_investments, joint_goals):
    # 1. HRA Optimization
    # Simplified HRA exemption logic: min(actual_hra, rent - 0.1*basic, 0.5*basic)
    # We'll assume basic is 50% of income for estimation.
    p1_basic = p1_income * 0.5
    p2_basic = p2_income * 0.5
    
    def get_hra_exemption(basic, actual_hra, rent_allocated):
        if rent_allocated <= 0: return 0
        return min(actual_hra, max(0, rent_allocated - 0.1 * basic), 0.5 * basic)

    # Strategy: Who should claim HRA?
    # Usually the one in higher tax bracket, or splitting if both have high HRA.
    # We'll calculate 3 scenarios: P1 claims, P2 claims, 50/50 split.
    s1_p1_ex = get_hra_exemption(p1_basic, p1_hra, rent_paid)
    s2_p2_ex = get_hra_exemption(p2_basic, p2_hra, rent_paid)
    s3_split = get_hra_exemption(p1_basic, p1_hra, rent_paid*0.5) + get_hra_exemption(p2_basic, p2_hra, rent_paid*0.5)
    
    hra_winner = "P1 Claims" if s1_p1_ex >= s2_p2_ex and s1_p1_ex >= s3_split else \
                 "P2 Claims" if s2_p2_ex >= s1_p1_ex and s2_p2_ex >= s3_split else "50/50 Split"
    max_exemption = max(s1_p1_ex, s2_p2_ex, s3_split)

    # 2. Combined Portfolio Check
    # Ideal emergency fund (6 months of combined expenses, assuming 60% of income is spent)
    combined_monthly = p1_income + p2_income
    ideal_emergency = combined_monthly * 0.6 * 6
    
    # 3. SIP Split Strategy
    # Ratio of incomes
    total_inc = p1_income + p2_income
    p1_ratio = p1_income / total_inc if total_inc > 0 else 0.5
    p2_ratio = 1 - p1_ratio
    
    # Suggested SIP (20% of income)
    suggested_sip = total_inc * 0.2
    
    return {
        "p1_income": p1_income,
        "p2_income": p2_income,
        "combined_income": total_inc,
        "hra_optimization": {
            "winner": hra_winner,
            "max_exemption": max_exemption,
            "p1_exemption": s1_p1_ex,
            "p2_exemption": s2_p2_ex,
            "split_exemption": s3_split
        },
        "emergency_fund": {
            "target": ideal_emergency,
            "current": combined_investments * 0.2, # Assumption: 20% of investments are liquid
            "status": "Green" if combined_investments*0.2 >= ideal_emergency else "Yellow"
        },
        "sip_strategy": {
            "total_suggested": suggested_sip,
            "p1_share": suggested_sip * p1_ratio,
            "p2_share": suggested_sip * p2_ratio
        },
        "joint_goals": joint_goals
    }
