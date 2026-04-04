"""Portfolio Allocation Service — Calculates asset distribution percentages."""

class AllocationService:
    @staticmethod
    def calculate(holdings: list) -> dict:
        """
        Input: list of holdings (id, asset_type, quantity, current_price, ...)
        Output: { total_value, allocation: { type: percentage } }
        """
        total_value = 0
        type_totals = {}

        for h in holdings:
            # handle both dict and sqlite3.Row
            qty = h["quantity"] if isinstance(h, (dict, object)) else h[4]
            price = h["current_price"] if isinstance(h, (dict, object)) else h[6]
            asset_type = h["asset_type"] if isinstance(h, (dict, object)) else h[2]
            
            value = float(qty) * float(price)
            total_value += value
            type_totals[asset_type] = type_totals.get(asset_type, 0) + value

        if total_value == 0:
            return {"total_value": 0, "allocation": {}}

        allocation = {
            t: round((v / total_value) * 100, 2)
            for t, v in type_totals.items()
        }

        return {
            "total_value": round(total_value, 2),
            "allocation": allocation
        }
