"""
ARIA — Money Health Score Calculator
Deterministic 6-dimension financial wellness scoring.
Each dimension is scored 0–100 based on evidence-backed Indian benchmarks.
Overall = weighted average.
"""

from dataclasses import dataclass, field
from typing import Dict, List


# ─── Scoring Rubric Benchmarks ─────────────────────────────────────────────────
#
# All benchmarks are for Indian salaried/self-employed adults.
# Sources: RBI, SEBI investor surveys, NLM financial literacy guidelines.

DIMENSION_WEIGHTS = {
    "emergency":    0.20,   # Most critical — protects all other plans
    "insurance":    0.20,   # Second most critical — prevents wealth destruction
    "investments":  0.20,   # Wealth creation
    "debt":         0.15,   # Limits wealth destruction
    "tax":          0.15,   # Reduces wealth leakage
    "retirement":   0.10,   # Long-term readiness
}


@dataclass
class DimensionScore:
    name: str
    score: int                      # 0–100
    grade: str                      # S/A/B/C/D
    benchmark: str                  # what ideal looks like
    current_metric: str             # user's current state
    actions: List[str] = field(default_factory=list)


@dataclass
class HealthScoreResult:
    overall_score: int
    grade: str
    dimensions: Dict[str, DimensionScore]
    top_actions: List[str]
    quick_wins: List[str]
    dimension_labels: List[str]     # for chart
    dimension_scores: List[int]     # for chart


# ─── Grade Helper ─────────────────────────────────────────────────────────────

def _grade(score: int) -> str:
    if score >= 90: return "S"
    if score >= 75: return "A"
    if score >= 55: return "B"
    if score >= 35: return "C"
    return "D"


# ─── Dimension Scorers ─────────────────────────────────────────────────────────

def score_emergency(emergency_fund: float, monthly_expenses: float) -> DimensionScore:
    """
    Benchmark: 6 months of expenses.
    Score:
      ≥ 6 months = 100
      3–6 months = 50–90 (linear)
      1–3 months = 20–50
      < 1 month  = 0–20
    """
    months = (emergency_fund / monthly_expenses) if monthly_expenses > 0 else 0

    if months >= 6:
        score = 100
    elif months >= 3:
        score = int(50 + (months - 3) / 3 * 40)
    elif months >= 1:
        score = int(20 + (months - 1) / 2 * 30)
    else:
        score = int(months * 20)

    actions = []
    if months < 6:
        shortfall = max(0, monthly_expenses * 6 - emergency_fund)
        actions.append(f"Build ₹{shortfall:,.0f} more in emergency fund ({6 - months:.1f} months short)")
    if months < 3:
        actions.append("Park emergency fund in liquid mutual fund or FD — not savings account")

    return DimensionScore(
        name="Emergency Preparedness",
        score=min(100, max(0, score)),
        grade=_grade(score),
        benchmark="6 months of expenses",
        current_metric=f"{months:.1f} months covered",
        actions=actions,
    )


def score_insurance(
    term_insurance_cr: float,
    health_insurance_l: float,
    monthly_income: float,
) -> DimensionScore:
    """
    Benchmark:
      Term insurance = 15–20× annual income
      Health insurance = ≥ ₹10L family floater
    Score: composite of both.
    """
    annual_income = monthly_income * 12
    term_ideal    = annual_income * 15

    term_score   = min(100, int((term_insurance_cr * 1_00_00_000) / max(1, term_ideal) * 100))
    health_score = min(100, int((health_insurance_l * 1_00_000) / 1_000_000 * 100))
    score        = (term_score + health_score) // 2

    actions = []
    if term_insurance_cr == 0:
        actions.append(f"Buy term insurance of ₹{annual_income * 15 / 1_00_00_000:.1f} Cr immediately (₹700-1200/month)")
    elif term_insurance_cr * 1_00_00_000 < term_ideal:
        gap = (term_ideal - term_insurance_cr * 1_00_00_000) / 1_00_00_000
        actions.append(f"Increase term cover by ₹{gap:.1f} Cr — currently under-insured")
    if health_insurance_l < 10:
        actions.append(f"Increase health cover to ₹10L+ (currently ₹{health_insurance_l}L)")
    if health_insurance_l == 0:
        actions.append("Buy health insurance immediately — ₹10L floater costs ₹8,000–15,000/yr")

    return DimensionScore(
        name="Insurance Coverage",
        score=min(100, max(0, score)),
        grade=_grade(score),
        benchmark="Term: 15× income | Health: ₹10L+",
        current_metric=f"Term: ₹{term_insurance_cr}Cr | Health: ₹{health_insurance_l}L",
        actions=actions,
    )


def score_investments(
    total_investments: float,
    monthly_income: float,
) -> DimensionScore:
    """
    Benchmark: Invest ≥ 20% of income monthly. Investment corpus ≥ 3× annual income.
    Score: corpus ratio vs income.
    """
    annual_income    = monthly_income * 12
    ideal_corpus     = annual_income * 3
    corpus_ratio     = total_investments / max(1, annual_income)

    if corpus_ratio >= 3:   score = 100
    elif corpus_ratio >= 2: score = int(75 + (corpus_ratio - 2) * 25)
    elif corpus_ratio >= 1: score = int(50 + (corpus_ratio - 1) * 25)
    elif corpus_ratio >= 0.5: score = int(30 + (corpus_ratio - 0.5) * 40)
    else: score = int(corpus_ratio * 60)

    actions = []
    if corpus_ratio < 1:
        actions.append("Start a monthly SIP of at least 20% of income immediately")
    if total_investments < annual_income:
        actions.append(f"Target ₹{annual_income * 3 / 100_000:.0f}L corpus (3× annual income)")
    if corpus_ratio >= 1:
        actions.append("Review asset allocation — equity % should decrease as you age")

    return DimensionScore(
        name="Investment Diversification",
        score=min(100, max(0, score)),
        grade=_grade(score),
        benchmark="3× annual income invested",
        current_metric=f"₹{total_investments:,.0f} ({corpus_ratio:.1f}× annual income)",
        actions=actions,
    )


def score_debt(
    total_debt: float,
    monthly_income: float,
) -> DimensionScore:
    """
    Benchmark: Total debt < 40% of annual income. No high-interest debt.
    Score: inversely proportional to debt-to-income ratio.
    """
    annual_income = monthly_income * 12
    debt_ratio = total_debt / max(1, annual_income)

    if debt_ratio == 0:      score = 100
    elif debt_ratio <= 0.2:  score = int(100 - debt_ratio * 100)
    elif debt_ratio <= 0.5:  score = int(80 - (debt_ratio - 0.2) * 133)
    elif debt_ratio <= 1.0:  score = int(40 - (debt_ratio - 0.5) * 60)
    else:                   score = max(0, int(10 - (debt_ratio - 1) * 10))

    actions = []
    if debt_ratio > 0.5:
        actions.append("Debt is high — focus on avalanche method: pay highest-interest debt first")
    if debt_ratio > 0.2:
        actions.append("Personal loans or credit card debt: pay off before investing aggressively")
    if debt_ratio == 0:
        actions.append("Excellent! Use this capacity for investments instead")

    return DimensionScore(
        name="Debt Health",
        score=min(100, max(0, score)),
        grade=_grade(score),
        benchmark="Total debt < 40% of annual income",
        current_metric=f"₹{total_debt:,.0f} ({debt_ratio:.1%} of annual income)",
        actions=actions,
    )


def score_tax(
    annual_tax_saving: float,
    monthly_income: float,
) -> DimensionScore:
    """
    Benchmark: Fully utilize 80C (₹1.5L) + NPS 80CCD(1B) (₹50K) = ₹2L total.
    Score: % of ₹2L fully utilized.
    """
    max_deductions = 200_000
    pct            = min(1.0, annual_tax_saving / max_deductions)
    score          = int(pct * 100)

    actions = []
    gap = max_deductions - annual_tax_saving
    if gap > 0:
        actions.append(f"Utilise ₹{gap/100_000:.1f}L more in 80C + NPS to save ₹{gap*0.30/1000:.0f}K+ in tax")
    if annual_tax_saving < 150_000:
        actions.append("80C gap: ELSS mutual funds give 80C benefit + equity returns")
    if annual_tax_saving < 200_000:
        actions.append("80CCD(1B): Add ₹50K to NPS Tier-1 for additional ₹15K tax saving")

    return DimensionScore(
        name="Tax Efficiency",
        score=min(100, max(0, score)),
        grade=_grade(score),
        benchmark="Full 80C + NPS = ₹2L utilised",
        current_metric=f"₹{annual_tax_saving:,.0f} invested (of ₹2L limit)",
        actions=actions,
    )


def score_retirement(
    total_investments: float,
    monthly_income: float,
    emergency_fund: float,
) -> DimensionScore:
    """
    Proxy for retirement readiness: investments + emergency discipline.
    Benchmark: corpus ≥ 1× annual income per decade worked (rough rule).
    """
    annual_income = monthly_income * 12
    ratio = total_investments / max(1, annual_income)

    if ratio >= 5:    score = 100
    elif ratio >= 3:  score = int(75 + (ratio - 3) * 12.5)
    elif ratio >= 1:  score = int(40 + (ratio - 1) * 17.5)
    else:             score = int(ratio * 40)

    actions = []
    if ratio < 1:
        actions.append("Start NPS or retirement SIP immediately — compound interest is most powerful when started early")
    if ratio < 3:
        actions.append(f"Increase monthly SIP — target ₹{annual_income * 5 / 100_000:.0f}L retirement corpus")
    if total_investments > 0:
        actions.append("Review EPF passbook annually — ensure employer is depositing on time")

    return DimensionScore(
        name="Retirement Readiness",
        score=min(100, max(0, score)),
        grade=_grade(score),
        benchmark="5× annual income invested for retirement",
        current_metric=f"₹{total_investments:,.0f} across instruments ({ratio:.1f}× annual income)",
        actions=actions,
    )


# ─── Main Calculator ──────────────────────────────────────────────────────────

def calculate_health_score(
    monthly_income: float,
    emergency_fund: float,
    term_insurance_cr: float,
    health_insurance_l: float,
    total_investments: float,
    total_debt: float,
    annual_tax_saving: float,
) -> HealthScoreResult:
    """
    Calculate 6-dimension Money Health Score (0–100).
    """
    monthly_expenses_estimate = monthly_income * 0.60   # 60% spend ratio fallback

    dims = {
        "emergency":   score_emergency(emergency_fund, monthly_expenses_estimate),
        "insurance":   score_insurance(term_insurance_cr, health_insurance_l, monthly_income),
        "investments": score_investments(total_investments, monthly_income),
        "debt":        score_debt(total_debt, monthly_income),
        "tax":         score_tax(annual_tax_saving, monthly_income),
        "retirement":  score_retirement(total_investments, monthly_income, emergency_fund),
    }

    # Weighted overall score
    overall = int(sum(
        dims[k].score * DIMENSION_WEIGHTS[k]
        for k in DIMENSION_WEIGHTS
    ))

    # Collect top actions (worst scoring dimensions first)
    sorted_dims = sorted(dims.values(), key=lambda d: d.score)
    top_actions = []
    quick_wins  = []

    for dim in sorted_dims:
        top_actions.extend(dim.actions[:2])   # top 2 per dim, worst first
        if dim.score >= 50 and dim.actions:
            quick_wins.append(dim.actions[0]) # easy wins from moderate dims

    return HealthScoreResult(
        overall_score=overall,
        grade=_grade(overall),
        dimensions=dims,
        top_actions=top_actions[:5],
        quick_wins=quick_wins[:3],
        dimension_labels=[d.name.split(" ")[0] for d in dims.values()],
        dimension_scores=[d.score for d in dims.values()],
    )
