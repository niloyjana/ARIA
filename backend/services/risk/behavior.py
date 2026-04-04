"""
ARIA — behaviorAnalysisService
Analyzes psychological factors and investment horizon.
"""

class BehaviorAnalysisService:
    @staticmethod
    def calculate(user_data: dict) -> int:
        """
        Analyze investment behavior based on horizon and reaction to market volatility.
        Return normalized behavior score (0–100).
        """
        scores = []
        
        # 1. Investment Horizon
        horizon = user_data.get("investment_horizon", 5)
        if isinstance(horizon, str):
            if "15" in horizon: h_score = 100
            elif "7" in horizon: h_score = 80
            elif "3" in horizon: h_score = 50
            else: h_score = 20
        else:
            h_score = 100 if horizon >= 15 else (80 if horizon >= 7 else (50 if horizon >= 3 else 20))
        scores.append(h_score)
        
        # 2. Market Reaction
        reaction = user_data.get("reaction_to_market_drop", "hold").lower()
        r_map = {"buy more": 100, "hold": 70, "sell some": 30, "sell all": 0}
        scores.append(r_map.get(reaction, 50))
        
        # 3. Primary Goal
        goal = user_data.get("primary_goal", "balanced").lower()
        g_map = {"wealth growth": 100, "balanced": 60, "capital preservation": 20, "income": 30}
        scores.append(g_map.get(goal, 50))
        
        final_score = sum(scores) / len(scores) if scores else 50
        return int(max(0, min(100, final_score)))

