import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from calculators.fire import calculate_fire
from calculators.health import calculate_health_score
from calculators.tax import compare_tax_regimes
from calculators.couple import calculate_couple_plan
from calculators.xray import analyze_portfolio
from calculators.life_event import analyze_life_event

def test_all():
    print("🧪 Running ARIA Hardened Math Engine Tests...\n")

    # 1. FIRE
    f = calculate_fire(30, 50, 100000, 50000, 500000)
    assert f.fire_number > 0
    print("✅ FIRE Planner: Pass")

    # 2. Health
    h = calculate_health_score(100000, 300000, 1, 5, 2000000, 0, 150000)
    assert h.overall_score >= 0 and h.overall_score <= 100
    print("✅ Health Score: Pass")

    # 3. Tax
    t = compare_tax_regimes(60000, 20000, 15000, "Metro", 100000, 0, 0)
    assert t.recommended in ["Old Regime", "New Regime"]
    print("✅ Tax Optimizer: Pass")

    # 4. Couple
    c = calculate_couple_plan(100000, 80000, 40000, 30000, 35000, 2000000, "House")
    assert c["combined_income"] == 180000
    print("✅ Couple Planner: Pass")

    # 5. X-Ray
    x = analyze_portfolio("HDFC Top 100 - 100000\nSBI Bluechip - 50000", "5-10 years", "Moderate", 20000)
    assert x["total_value"] == 150000
    print("✅ Portfolio X-Ray: Pass")

    # 6. Life Event
    le = analyze_life_event("Bonus", 500000, 1500000, "30%", "Aggressive", 1000000)
    assert le["amount"] == 500000
    print("✅ Life Event Advisor: Pass")

    print("\n🎉 ALL DETERMINISTIC CALCULATORS VERIFIED!")

if __name__ == "__main__":
    try:
        test_all()
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        sys.exit(1)
