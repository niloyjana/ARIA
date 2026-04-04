"""
ARIA — Risk Profile Analyzer
Refactored to use modular services for behavioral, stability, and portfolio analysis.
"""
from services.risk.behavior import BehaviorAnalysisService
from services.risk.stability import FinancialStabilityService
from services.risk.portfolio import PortfolioRiskService
from services.risk.scoring import RiskScoringService

def calculate_risk_profile(behavioral_answers: dict, financial_data: dict, portfolio_data: dict = None) -> dict:
    """
    Acts as a facade to orchestrate modular risk services.
    Maintains backward compatibility with the existing API.
    """
    # 1. Individual Service Calculations
    behavior_score = BehaviorAnalysisService.calculate(behavioral_answers)
    stability_score = FinancialStabilityService.calculate(financial_data)
    portfolio_score = PortfolioRiskService.calculate(portfolio_data)
    
    # 2. Aggregate and Score
    profile = RiskScoringService.calculate(
        behavior_score,
        stability_score,
        portfolio_score
    )
    
    # 3. Backward Compatibility Mapping
    # server.py and DB schema expect 'risk_category'
    profile["risk_category"] = profile["category"]
    
    return profile

