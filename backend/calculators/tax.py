"""
ARIA — Indian Income Tax Calculator (FY 2024-25)
Implements real tax slab math for both Old and New Regime.

Sources:
  - Finance Act 2024 (Union Budget July 2024)
  - Income Tax Act 1961
"""

from dataclasses import dataclass, field
from typing import List, Tuple


# ─── Data Classes ──────────────────────────────────────────────────────────────

@dataclass
class TaxDeductions:
    """All applicable deductions under Old Regime."""
    standard_deduction: float = 50_000          # Section 16(ia)
    section_80c: float = 0                       # ELSS, PPF, LIC, ELSS etc. (max 1.5L)
    section_80ccd_1b: float = 0                  # NPS Tier-1 additional (max 50K)
    section_80d: float = 0                       # Health insurance premium
    home_loan_interest: float = 0               # Section 24(b), max 2L self-occ
    hra_exemption: float = 0                    # House Rent Allowance
    total: float = field(init=False)

    def __post_init__(self):
        self.section_80c      = min(self.section_80c, 150_000)
        self.section_80ccd_1b = min(self.section_80ccd_1b, 50_000)
        self.home_loan_interest = min(self.home_loan_interest, 200_000)
        self.total = (
            self.standard_deduction
            + self.section_80c
            + self.section_80ccd_1b
            + self.section_80d
            + self.home_loan_interest
            + self.hra_exemption
        )


@dataclass
class HRAResult:
    actual_hra: float
    rent_minus_10pct_basic: float
    pct_of_basic: float
    exemption: float
    taxable_hra: float
    note: str


@dataclass
class TaxBreakdown:
    """Detailed tax computation for one regime."""
    regime: str
    gross_income: float
    deductions: float
    taxable_income: float
    slab_tax: float
    surcharge: float
    cess: float
    total_tax: float
    effective_rate: float
    rebate_applied: float
    slab_details: List[Tuple[str, float]]   # [(slab label, tax amount)]


@dataclass
class TaxComparisonResult:
    old_regime: TaxBreakdown
    new_regime: TaxBreakdown
    recommended: str                         # "Old" or "New"
    savings: float                           # how much is saved by choosing recommended
    hra: HRAResult
    deduction_gaps: dict                    # what 80C/NPS gap is remaining


# ─── HRA Exemption ─────────────────────────────────────────────────────────────

def calculate_hra_exemption(
    basic_monthly: float,
    hra_monthly: float,
    rent_monthly: float,
    city_type: str                          # "Metro" or "Non-Metro"
) -> HRAResult:
    """
    HRA exemption = MIN of:
      1. Actual HRA received
      2. Rent paid − 10% of Basic (annual)
      3. 50% of Basic (Metro) or 40% of Basic (Non-Metro)
    """
    if rent_monthly <= 0 or hra_monthly <= 0:
        return HRAResult(
            actual_hra=0, rent_minus_10pct_basic=0,
            pct_of_basic=0, exemption=0,
            taxable_hra=hra_monthly * 12,
            note="No rent paid — full HRA is taxable."
        )

    annual_basic = basic_monthly * 12
    annual_hra   = hra_monthly   * 12
    annual_rent  = rent_monthly  * 12

    comp1 = annual_hra
    comp2 = max(0, annual_rent - 0.10 * annual_basic)
    comp3 = 0.50 * annual_basic if city_type.lower() == "metro" else 0.40 * annual_basic

    exemption = min(comp1, comp2, comp3)
    taxable   = annual_hra - exemption

    limiting = "Actual HRA" if exemption == comp1 else (
        "Rent − 10% Basic" if exemption == comp2 else
        f"{'50%' if city_type.lower() == 'metro' else '40%'} of Basic ({city_type})"
    )

    return HRAResult(
        actual_hra=comp1,
        rent_minus_10pct_basic=comp2,
        pct_of_basic=comp3,
        exemption=exemption,
        taxable_hra=taxable,
        note=f"Exemption limited by: {limiting}"
    )


# ─── Slab Tax Computation ───────────────────────────────────────────────────────

def _apply_slabs(taxable: float, slabs: List[Tuple[float, float, str]]) -> Tuple[float, List[Tuple[str, float]]]:
    """
    Generic slab engine.
    slabs: [(lower, upper, label), ...]  — upper=None means no ceiling
    Returns (total_tax, slab_details)
    """
    tax = 0.0
    details = []
    for lower, upper, rate, label in slabs:
        if taxable <= lower:
            break
        upper_bound = upper if upper else float("inf")
        income_in_slab = min(taxable, upper_bound) - lower
        slab_tax = income_in_slab * rate
        if slab_tax > 0:
            details.append((label, round(slab_tax)))
        tax += slab_tax
    return round(tax), details


# FY 2024-25 New Regime slabs (post Union Budget July 2024)
NEW_REGIME_SLABS = [
    (0,        300_000,  0.00,  "₹0 – ₹3L @ 0%"),
    (300_000,  700_000,  0.05,  "₹3L – ₹7L @ 5%"),
    (700_000,  1_000_000, 0.10, "₹7L – ₹10L @ 10%"),
    (1_000_000, 1_200_000, 0.15, "₹10L – ₹12L @ 15%"),
    (1_200_000, 1_500_000, 0.20, "₹12L – ₹15L @ 20%"),
    (1_500_000, None,     0.30,  "₹15L+ @ 30%"),
]

# FY 2024-25 Old Regime slabs
OLD_REGIME_SLABS = [
    (0,          250_000,  0.00, "₹0 – ₹2.5L @ 0%"),
    (250_000,    500_000,  0.05, "₹2.5L – ₹5L @ 5%"),
    (500_000,  1_000_000,  0.20, "₹5L – ₹10L @ 20%"),
    (1_000_000,  None,     0.30, "₹10L+ @ 30%"),
]


def _surcharge(tax: float, taxable_income: float) -> float:
    """Income tax surcharge for FY2024-25."""
    if taxable_income <= 5_000_000:       return 0
    if taxable_income <= 10_000_000:      return tax * 0.10
    if taxable_income <= 20_000_000:      return tax * 0.15
    if taxable_income <= 50_000_000:      return tax * 0.25
    return tax * 0.37


def _cess(tax_plus_surcharge: float) -> float:
    """4% Health & Education Cess."""
    return round(tax_plus_surcharge * 0.04)


def _marginal_relief(slab_tax: float, taxable: float, threshold: float) -> float:
    """
    Marginal relief: tax should never exceed income above the threshold.
    Applied near 87A rebate boundaries.
    """
    if taxable > threshold:
        excess_income = taxable - threshold
        return min(slab_tax, max(0, slab_tax - excess_income))
    return slab_tax


# ─── Old Regime Tax ────────────────────────────────────────────────────────────

def compute_old_regime(
    gross_annual: float,
    deductions: TaxDeductions,
) -> TaxBreakdown:
    taxable = max(0, gross_annual - deductions.total)
    slab_tax, slab_details = _apply_slabs(taxable, OLD_REGIME_SLABS)

    # 87A Rebate: If taxable ≤ 5L, tax = 0 (max rebate ₹12,500)
    rebate = 0.0
    if taxable <= 500_000:
        rebate = min(slab_tax, 12_500)
        slab_tax = max(0, slab_tax - rebate)

    surcharge = _surcharge(slab_tax, taxable)
    cess = _cess(slab_tax + surcharge)
    total = round(slab_tax + surcharge + cess)
    eff = (total / gross_annual * 100) if gross_annual > 0 else 0

    return TaxBreakdown(
        regime="Old Regime",
        gross_income=gross_annual,
        deductions=deductions.total,
        taxable_income=taxable,
        slab_tax=slab_tax + rebate,
        surcharge=surcharge,
        cess=cess,
        total_tax=total,
        effective_rate=round(eff, 2),
        rebate_applied=rebate,
        slab_details=slab_details,
    )


# ─── New Regime Tax ────────────────────────────────────────────────────────────

def compute_new_regime(gross_annual: float) -> TaxBreakdown:
    # New regime: standard deduction ₹75,000 only (Budget 2024)
    STD_DEDUCTION_NEW = 75_000
    taxable = max(0, gross_annual - STD_DEDUCTION_NEW)
    slab_tax, slab_details = _apply_slabs(taxable, NEW_REGIME_SLABS)

    # 87A Rebate: If taxable ≤ 7L, tax = 0 (max rebate ₹25,000)
    rebate = 0.0
    if taxable <= 700_000:
        rebate = min(slab_tax, 25_000)
        slab_tax = max(0, slab_tax - rebate)

    surcharge = _surcharge(slab_tax, taxable)
    cess = _cess(slab_tax + surcharge)
    total = round(slab_tax + surcharge + cess)
    eff = (total / gross_annual * 100) if gross_annual > 0 else 0

    return TaxBreakdown(
        regime="New Regime",
        gross_income=gross_annual,
        deductions=STD_DEDUCTION_NEW,
        taxable_income=taxable,
        slab_tax=slab_tax + rebate,
        surcharge=surcharge,
        cess=cess,
        total_tax=total,
        effective_rate=round(eff, 2),
        rebate_applied=rebate,
        slab_details=slab_details,
    )


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def compare_tax_regimes(
    basic_monthly: float,
    hra_monthly: float,
    rent_monthly: float,
    city_type: str,
    existing_80c: float,
    home_loan_interest: float,
    nps_contribution: float,
    health_insurance: float = 25_000,
) -> TaxComparisonResult:
    """
    Full FY2024-25 tax comparison.
    Returns a TaxComparisonResult with old+new regime breakdowns and recommendation.
    """
    gross_annual = basic_monthly * 12 + hra_monthly * 12

    # HRA Exemption
    hra = calculate_hra_exemption(basic_monthly, hra_monthly, rent_monthly, city_type)

    # Old Regime Deductions
    deductions = TaxDeductions(
        standard_deduction=50_000,
        section_80c=min(existing_80c, 150_000),
        section_80ccd_1b=min(nps_contribution, 50_000),
        section_80d=min(health_insurance, 25_000),
        home_loan_interest=min(home_loan_interest, 200_000),
        hra_exemption=hra.exemption,
    )

    old = compute_old_regime(gross_annual, deductions)
    new = compute_new_regime(gross_annual)

    recommended = "Old Regime" if old.total_tax <= new.total_tax else "New Regime"
    savings = abs(old.total_tax - new.total_tax)

    deduction_gaps = {
        "80c_gap": max(0, 150_000 - existing_80c),
        "nps_gap": max(0, 50_000 - nps_contribution),
        "potential_additional_deductions": max(0, 150_000 - existing_80c) + max(0, 50_000 - nps_contribution),
    }

    return TaxComparisonResult(
        old_regime=old,
        new_regime=new,
        recommended=recommended,
        savings=savings,
        hra=hra,
        deduction_gaps=deduction_gaps,
    )
