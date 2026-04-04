from services.risk.behavior import BehaviorAnalysisService as Behavior
from services.risk.stability import FinancialStabilityService as Stability
from services.risk.portfolio import PortfolioRiskService as Portfolio
from services.risk.scoring import RiskScoringService as Scoring

def test_modular_services():
    print("🧪 Starting Risk Service Unit Tests...")
    
    # 1. Test Behavior Isolated
    b_score = Behavior.calculate({"investment_horizon": 15, "reaction_to_market_drop": "buy more", "primary_goal": "wealth growth"})
    print(f"✅ Behavior Service (Aggressive): {b_score}")
    assert b_score == 100
    
    # 2. Test Stability Isolated
    f_score = Stability.calculate({"savings_rate": 35, "emergency_fund_months": 8, "total_assets": 1000, "total_liabilities": 100})
    print(f"✅ Stability Service (Very Stable): {f_score}")
    assert f_score == 100
    
    # 3. Test Orchestrator
    profile = Scoring.calculate_total_profile(
        {"investment_horizon": 5, "reaction_to_market_drop": "hold", "primary_goal": "balanced"},
        {"savings_rate": 10, "emergency_fund_months": 3, "total_assets": 1000, "total_liabilities": 200},
        {"equity_percentage": 60}
    )
    print(f"✅ Orchestrated Profile: {profile['risk_score']} ({profile['risk_category']})")
    assert "Moderate" in profile['risk_category']
    
    print("\n🚀 ALL SERVICES ARE INDEPENDENTLY TESTABLE AND ACCURATE!")

if __name__ == "__main__":
    test_modular_services()
