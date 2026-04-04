import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from services.portfolio.allocation import AllocationService

def test_allocation_basic():
    holdings = [
        {"asset_type": "equity", "quantity": 10, "current_price": 5000}, # 50,000
        {"asset_type": "equity", "quantity": 5, "current_price": 10000}, # 50,000
        {"asset_type": "gold",   "quantity": 2, "current_price": 25000}, # 50,000
    ]
    result = AllocationService.calculate(holdings)
    assert result["total_value"] == 150000
    assert result["allocation"]["equity"] == 66.67
    assert result["allocation"]["gold"] == 33.33

def test_allocation_empty():
    result = AllocationService.calculate([])
    assert result["total_value"] == 0
    assert result["allocation"] == {}
