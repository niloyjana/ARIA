"""
ARIA — riskScoringService
Orchestrates modular services to produce the final risk profile.
"""

class RiskScoringService:

    @staticmethod
    def calculate(behavior_score: int, stability_score: int, portfolio_score: int) -> dict:
        """
        Aggregate scores from Behavior, Stability, and Portfolio services.
        Apply weights: 40% Behavior, 30% Stability, 30% Portfolio.
        """
        # 1. Final Weighted Calculation (40/30/30)
        final_score = (behavior_score * 0.40) + (stability_score * 0.30) + (portfolio_score * 0.30)
        final_score = int(max(0, min(100, round(final_score))))
        
        # 2. Classification Mapping
        if final_score <= 20: category = "Very Conservative"
        elif final_score <= 40: category = "Conservative"
        elif final_score <= 60: category = "Moderate"
        elif final_score <= 80: category = "Moderately Aggressive"
        else: category = "Aggressive"
        
        return {
            "risk_score": final_score,
            "category": category,
            "breakdown": {
                "behavior": behavior_score,
                "stability": stability_score,
                "portfolio": portfolio_score
            }
        }

