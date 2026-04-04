"""
ARIA — portfolioRiskService
Analyzes risk capacity based on asset allocation.
"""

class PortfolioRiskService:
    @staticmethod
    def calculate(user_data: dict = None) -> int:
        """
        Analyze current portfolio allocation (equity, crypto, diversification).
        Return normalized portfolio risk score (0–100).
        """
        if not user_data:
            return 50 # Neutral default
            
        scores = []
        
        # 1. Equity Exposure (Higher equity = Higher risk profile)
        equity_pct = user_data.get("equity_percentage", 50)
        scores.append(equity_pct)
        
        # 2. Crypto Exposure (Moderate/High crypto = Higher risk profile)
        crypto_pct = user_data.get("crypto_percentage", 0)
        # We cap crypto's contribution to risk score increase
        crypto_score = min(100, crypto_pct * 5) # 20% crypto = 100 risk points for this factor
        scores.append(crypto_score)
        
        # 3. Diversification Risk (Lower diversification = Higher risk)
        # Assume diversification_score 0-100 where 100 is well diversified
        # Risk score is (100 - diversification_score)
        div_score = user_data.get("diversification_score", 70)
        scores.append(100 - div_score)
        
        final_score = sum(scores) / len(scores) if scores else 50
        return int(max(0, min(100, final_score)))

