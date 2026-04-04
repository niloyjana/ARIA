"""Portfolio Dashboard Aggregator Service — Combines analytics for a complete overview."""
from services.portfolio.allocation import AllocationService
from services.portfolio.diversification import DiversificationService
from services.portfolio.performance import PerformanceService
from database import get_conn

class PortfolioDashboardService:
    @staticmethod
    def generate() -> dict:
        """
        1. Fetch holdings from DB
        2. Run allocation
        3. Run diversification
        4. Run performance
        5. Return unified analytics
        """
        with get_conn() as conn:
            rows = conn.execute("SELECT * FROM portfolio_holdings").fetchall()
            holdings = [dict(row) for row in rows]

        if not holdings:
            return {
                "portfolio_value": 0,
                "allocation": {},
                "performance": {"invested_value": 0, "current_value": 0, "profit": 0, "return_pct": 0},
                "diversification": {"score": 0, "category": "NA (No Data)"}
            }

        # Run Deterministic Services
        allocation = AllocationService.calculate(holdings)
        diversification = DiversificationService.calculate(holdings)
        performance = PerformanceService.calculate(holdings)

        return {
            "portfolio_value": performance["current_value"],
            "allocation": allocation["allocation"],
            "performance": performance,
            "diversification": {
                "score": diversification["diversification_score"],
                "category": diversification["risk_flag"],
                "risk_level": diversification["risk_level"],
                "details": diversification["details"]
            }
        }
