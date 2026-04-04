"""
ARIA — financialStabilityService
Analyzes quantitative financial health and stability.
"""

class FinancialStabilityService:
    @staticmethod
    def calculate(user_data: dict) -> int:
        """
        Analyze financial stability based on savings, emergency fund, and debt-to-income ratio.
        Return normalized stability score (0–100).
        """
        scores = []
        
        # 1. Savings Rate
        savings_rate = user_data.get("savings_rate", 20)
        s_score = 100 if savings_rate >= 30 else (50 if savings_rate >= 15 else (20 if savings_rate > 0 else 0))
        scores.append(s_score)
        
        # 2. Emergency Fund
        ef_months = user_data.get("emergency_fund_months", 3)
        ef_score = 100 if ef_months >= 6 else (50 if ef_months >= 3 else 10)
        scores.append(ef_score)
        
        # 3. Debt-to-Income / Debt-to-Equity (Stability)
        # Using Debt-to-Equity ratio from total_assets/total_liabilities as a proxy for stability
        assets = user_data.get("total_assets", 1)
        liabilities = user_data.get("total_liabilities", 0)
        de_ratio = liabilities / assets if assets > 0 else 1.0
        de_score = 100 if de_ratio < 0.2 else (60 if de_ratio < 0.5 else 20)
        scores.append(de_score)
        
        final_score = sum(scores) / len(scores) if scores else 50
        return int(max(0, min(100, final_score)))

