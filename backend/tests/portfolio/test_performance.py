import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from services.portfolio.performance import PerformanceService

def test_performance_profit():
    holdings = [
        {"asset_name": "Stock A", "quantity": 10, "avg_price": 1000, "current_price": 1200}, # 10k -> 12k
        {"asset_name": "Gold B",  "quantity": 5, "avg_price": 5000, "current_price": 5500}, # 25k -> 27.5k
    ]
    # Total Invested = 35k
    # Total Current = 39.5k
    # Profit = 4.5k
    # Return % = 4.5/35 * 100 = 12.86%
    result = PerformanceService.calculate(holdings)
    assert result["invested_value"] == 35000
    assert result["current_value"] == 39500
    assert result["profit"] == 4500
    assert result["return_pct"] == 12.86

def test_performance_loss():
    holdings = [
        {"asset_name": "Crypto C", "quantity": 1, "avg_price": 50000, "current_price": 40000}, # 50k -> 40k
    ]
    result = PerformanceService.calculate(holdings)
    assert result["profit"] == -10000
    assert result["return_pct"] == -20.0
