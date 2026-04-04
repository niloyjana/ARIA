"""Manual Verification Sketch - Portfolio Dashboard Services"""
import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from services.portfolio.allocation import AllocationService
from services.portfolio.diversification import DiversificationService
from services.portfolio.performance import PerformanceService

def run_verify():
    print("🚀 Starting Portfolio Service Verification...\n")
    
    # 🧪 Test Case: Standard Portfolio
    holdings = [
        {"asset_name": "Nifty 50 Index", "asset_type": "equity", "quantity": 100, "avg_price": 200, "current_price": 250}, # 20k invest, 25k curr
        {"asset_name": "Gold ETF",      "asset_type": "gold",   "quantity": 10,  "avg_price": 1000, "current_price": 1100}, # 10k invest, 11k curr
    ]
    
    # 1. Performance
    perf = PerformanceService.calculate(holdings)
    print(f"📊 Performance: Invested={perf['invested_value']}, Current={perf['current_value']}, Profit={perf['profit']}, Return={perf['return_pct']}%")
    assert perf["profit"] == 6000
    assert perf["return_pct"] == 20.0
    
    # 2. Allocation
    alloc = AllocationService.calculate(holdings)
    print(f"🧩 Allocation: {alloc['allocation']}")
    assert alloc["allocation"]["equity"] == 69.44
    assert alloc["allocation"]["gold"] == 30.56
    
    # 3. Diversification
    div = DiversificationService.calculate(holdings)
    print(f"🛡️ Diversification: Score={div['diversification_score']}, Category={div['risk_flag']}, Risk={div['risk_level']}")
    print(f"   Details: {div['details']}")
    # Score = 100 - 20 (only 2 classes) - 40 (Nifty is 25/36 = 69% > 60%) = 40
    assert div["diversification_score"] == 40
    assert div["risk_flag"] == "Moderately Diversified"
    assert div["risk_level"] == "Medium Risk"

    # 🧪 Test Case: Concentration Risk (Single Asset > 60%)
    holdings_concentration = [
        {"asset_name": "Reliance", "asset_type": "equity", "quantity": 90, "avg_price": 1000, "current_price": 1000}, # 90k
        {"asset_name": "Gold",     "asset_type": "gold",   "quantity": 10, "avg_price": 1000, "current_price": 1000}, # 10k
    ]
    div_c = DiversificationService.calculate(holdings_concentration)
    print(f"\n⚠️ Concentration Case: Score={div_c['diversification_score']}, Max Asset={div_c['details']['max_asset_concentration']}%")
    # Score = 100 - 40 (Single Asset >60%) - 20 (Equity >80%) - 20 (Asset classes <3) = 20
    assert div_c["diversification_score"] == 20
    assert div_c["risk_level"] == "High Risk"

    print("\n✅ All core service math verified!")

if __name__ == "__main__":
    run_verify()
