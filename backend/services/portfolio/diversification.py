"""Diversification Score Service — Calculates score (0–100) based on asset concentration."""

class DiversificationService:
    @staticmethod
    def calculate(holdings: list) -> dict:
        """
        Logic: score = base 100
        Penalties:
        - single asset >60% = -40
        - equity exposure >80% = -20
        - fewer than 3 asset classes = -20
        - crypto >25% = -10
        """
        score = 100
        total_value = 0
        asset_values = {}  # by name
        type_values = {}   # by type

        for h in holdings:
            qty = float(h["quantity"])
            price = float(h["current_price"])
            name = h["asset_name"]
            atype = h["asset_type"]
            
            val = qty * price
            total_value += val
            asset_values[name] = asset_values.get(name, 0) + val
            type_values[atype] = type_values.get(atype, 0) + val

        if total_value == 0:
            return {"diversification_score": 0, "risk_flag": "NA (No Data)"}

        # 1. Single Asset Concentration (>60% = -40)
        max_asset_pct = max([(v / total_value) * 100 for v in asset_values.values()])
        if max_asset_pct > 60:
            score -= 40

        # 2. Equity Exposure (>80% = -20)
        equity_pct = (type_values.get("equity", 0) / total_value) * 100
        if equity_pct > 80:
            score -= 20

        # 3. Asset Classes Count (<3 = -20)
        if len(type_values) < 3:
            score -= 20

        # 4. Crypto Exposure (>25% = -10)
        crypto_pct = (type_values.get("crypto", 0) / total_value) * 100
        if crypto_pct > 25:
            score -= 10

        # Clamp Score
        score = max(0, min(100, score))

        # Risk Level Mapping
        if score >= 70:
            category = "Well Diversified"
            risk_level = "Low Risk"
        elif score >= 40:
            category = "Moderately Diversified"
            risk_level = "Medium Risk"
        else:
            category = "Poorly Diversified"
            risk_level = "High Risk"

        return {
            "diversification_score": score,
            "risk_flag": category,
            "risk_level": risk_level,
            "details": {
                "max_asset_concentration": round(max_asset_pct, 2),
                "equity_exposure": round(equity_pct, 2),
                "crypto_exposure": round(crypto_pct, 2),
                "asset_classes_count": len(type_values)
            }
        }
