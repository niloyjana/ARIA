"""
ARIA — FIRE (Financial Independence, Retire Early) Calculator
Real compounding math using future value and SIP formulas.

Formulas:
  FIRE Number    = Annual Expenses × 25  (inverse of 4% safe withdrawal rate)
  FV of Lump Sum = P × (1+r)^n
  SIP FV         = P × [((1+r_m)^n_m − 1) / r_m] × (1+r_m)
  Required SIP   = (FIRE_Number − FV_existing) / SIP_growth_factor
"""

from dataclasses import dataclass, field
from typing import List, Dict


# ─── Data Classes ──────────────────────────────────────────────────────────────

@dataclass
class YearlyProjection:
    year: int
    age: int
    portfolio_value: float
    cumulative_invested: float
    returns_earned: float


@dataclass
class FIREResult:
    # Core Numbers
    fire_number: float               # Target corpus (expenses × 25)
    years_to_fire: int
    existing_fv: float               # What current investments grow to
    corpus_gap: float                # Additional corpus still needed
    required_monthly_sip: float      # SIP needed to bridge the gap
    current_monthly_savings: float   # income − expenses

    # SIP Analysis
    sip_gap: float                   # required_sip − current_savings
    sip_achievable: bool             # Can user hit it with current savings margin?

    # Insurance Targets
    ideal_term_cover: float          # 15× annual income
    ideal_health_cover: float        # ₹25L minimum

    # Emergency Fund
    emergency_fund_target: float     # 6 months expenses
    emergency_fund_shortfall: float  # target − existing_emergency

    # Milestones (₹ portfolio at each 5-yr mark)
    yearly_projections: List[YearlyProjection] = field(default_factory=list)
    milestone_labels: List[str] = field(default_factory=list)
    milestone_values: List[float] = field(default_factory=list)

    # Scenario Projections
    conservative_corpus: float = 0   # 10% CAGR
    moderate_corpus: float = 0       # 12% CAGR
    optimistic_corpus: float = 0     # 15% CAGR


# ─── SIP Future Value ─────────────────────────────────────────────────────────

def sip_future_value(monthly_sip: float, annual_rate: float, years: int) -> float:
    """
    Standard SIP FV formula:
    FV = P × [((1+r)^n − 1) / r] × (1+r)
    where r = monthly rate, n = months
    """
    if years <= 0 or monthly_sip <= 0:
        return 0.0
    r = annual_rate / 12
    n = years * 12
    if r == 0:
        return monthly_sip * n
    return monthly_sip * (((1 + r) ** n - 1) / r) * (1 + r)


def required_sip_for_target(target: float, annual_rate: float, years: int) -> float:
    """
    Reverse SIP formula: how much monthly SIP is needed to reach `target`?
    P = FV × r / [((1+r)^n − 1) × (1+r)]
    """
    if years <= 0 or target <= 0:
        return 0.0
    r = annual_rate / 12
    n = years * 12
    if r == 0:
        return target / n if n > 0 else 0
    return target * r / (((1 + r) ** n - 1) * (1 + r))


def lump_sum_future_value(principal: float, annual_rate: float, years: int) -> float:
    """Standard compound interest: FV = P(1+r)^n"""
    if years <= 0 or principal <= 0:
        return 0.0
    return principal * ((1 + annual_rate) ** years)


# ─── Year-by-Year Projection ──────────────────────────────────────────────────

def build_yearly_projections(
    existing_investments: float,
    monthly_sip: float,
    annual_rate: float,
    start_age: int,
    years: int,
) -> List[YearlyProjection]:
    """
    Build year-by-year portfolio growth combining lump sum + SIP.
    """
    projections = []
    monthly_rate = annual_rate / 12
    portfolio = existing_investments
    cumulative = existing_investments

    for y in range(1, years + 1):
        # Lump sum grows for 1 more year
        # SIP contribution for this year
        months_done = (y - 1) * 12
        sip_contribution = monthly_sip * 12

        # End-of-year portfolio value
        portfolio = (
            existing_investments * ((1 + annual_rate) ** y)
            + sip_future_value(monthly_sip, annual_rate, y)
        )
        cumulative = existing_investments + monthly_sip * 12 * y

        projections.append(YearlyProjection(
            year=y,
            age=start_age + y,
            portfolio_value=round(portfolio),
            cumulative_invested=round(cumulative),
            returns_earned=round(portfolio - cumulative),
        ))

    return projections


# ─── Main Calculator ──────────────────────────────────────────────────────────

def calculate_fire(
    age: int,
    retirement_age: int,
    monthly_income: float,
    monthly_expenses: float,
    existing_investments: float,
    term_insurance_cr: float = 0,
    health_insurance_l: float = 0,
    emergency_fund: float = 0,
    cagr: float = 0.12,
) -> FIREResult:
    """
    Comprehensive FIRE calculation with real compounding math.
    """
    years = max(1, retirement_age - age)
    annual_expenses = monthly_expenses * 12
    annual_income   = monthly_income   * 12
    monthly_savings = monthly_income - monthly_expenses

    # ── FIRE Number (4% Rule) ──────────────────────────────────────
    fire_number = annual_expenses * 25

    # ── Future Value of Existing Investments ───────────────────────
    existing_fv = lump_sum_future_value(existing_investments, cagr, years)

    # ── Additional Corpus Required ─────────────────────────────────
    corpus_gap = max(0, fire_number - existing_fv)

    # ── Required Monthly SIP ───────────────────────────────────────
    required_sip = required_sip_for_target(corpus_gap, cagr, years) if corpus_gap > 0 else 0
    sip_gap = required_sip - max(0, monthly_savings)

    # ── Insurance Targets ──────────────────────────────────────────
    ideal_term  = annual_income * 15       # 15× annual income
    ideal_health = 2_500_000              # ₹25L minimum

    # ── Emergency Fund ─────────────────────────────────────────────
    em_target = monthly_expenses * 6
    em_shortfall = max(0, em_target - emergency_fund)

    # ── Yearly Projections ─────────────────────────────────────────
    actual_sip = max(monthly_savings, 0)   # What user CAN invest now
    projections = build_yearly_projections(
        existing_investments, actual_sip, cagr, age, years
    )

    # 5-year milestones for chart
    milestone_labels = []
    milestone_values = []
    for p in projections:
        if p.year % 5 == 0 or p.year == years:
            milestone_labels.append(f"Yr {p.year} (Age {p.age})")
            milestone_values.append(round(p.portfolio_value / 100_000, 1))  # in lakhs

    # ── 3 Scenarios at retirement ──────────────────────────────────
    def scenario_corpus(rate):
        return (
            lump_sum_future_value(existing_investments, rate, years)
            + sip_future_value(actual_sip, rate, years)
        )

    return FIREResult(
        fire_number=round(fire_number),
        years_to_fire=years,
        existing_fv=round(existing_fv),
        corpus_gap=round(corpus_gap),
        required_monthly_sip=round(required_sip),
        current_monthly_savings=round(monthly_savings),
        sip_gap=round(sip_gap),
        sip_achievable=sip_gap <= 0,
        ideal_term_cover=round(ideal_term),
        ideal_health_cover=ideal_health,
        emergency_fund_target=round(em_target),
        emergency_fund_shortfall=round(em_shortfall),
        yearly_projections=projections,
        milestone_labels=milestone_labels,
        milestone_values=milestone_values,
        conservative_corpus=round(scenario_corpus(0.10)),
        moderate_corpus=round(scenario_corpus(0.12)),
        optimistic_corpus=round(scenario_corpus(0.15)),
    )


# ─── Quick Helper ─────────────────────────────────────────────────────────────

def lakhs(n: float) -> str:
    """Format number in Indian lakhs/crores."""
    if n >= 10_000_000:
        return f"₹{n/10_000_000:.2f} Cr"
    if n >= 100_000:
        return f"₹{n/100_000:.2f} L"
    return f"₹{n:,.0f}"
