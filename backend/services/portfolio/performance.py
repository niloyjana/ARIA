"""Portfolio Performance Service — Calculates P&L and ROI metrics."""

class PerformanceService:
    @staticmethod
    def calculate(holdings: list) -> dict:
        """
        Input: list of holdings
        Output: { invested_value, current_value, profit, return_pct }
        """
        invested_value = 0
        current_value = 0

        for h in holdings:
            qty = float(h["quantity"])
            avg_p = float(h["avg_price"])
            curr_p = float(h["current_price"])
            
            invested_value += (qty * avg_p)
            current_value += (qty * curr_p)

        if invested_value == 0:
            return {
                "invested_value": 0,
                "current_value": round(current_value, 2),
                "profit": 0,
                "return_pct": 0
            }

        profit = current_value - invested_value
        return_pct = (profit / invested_value) * 100

        return {
            "invested_value": round(invested_value, 2),
            "current_value": round(current_value, 2),
            "profit": round(profit, 2),
            "return_pct": round(return_pct, 2)
        }
