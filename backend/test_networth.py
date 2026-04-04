import os, sys, json, unittest
from pathlib import Path

# Add backend to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from calculators.networth import calculate_networth, get_networth_trend

class TestNetWorth(unittest.TestCase):
    def test_networth_calculation(self):
        # Success
        res = calculate_networth(1000, 400)
        self.assertEqual(res["net_worth"], 600)
        
        # Negative Input
        res_err = calculate_networth(-100, 50)
        self.assertIn("error", res_err)

    def test_trend_calculation(self):
        history = [
            {"date": "2024-01-01", "net_worth": 100000},
            {"date": "2024-02-01", "net_worth": 120000},
            {"date": "2024-03-01", "net_worth": 150000},
        ]
        res = get_networth_trend(history)
        self.assertEqual(res["change_percentage"], 50.0)
        
        # Corner cases
        self.assertEqual(get_networth_trend([])["change_percentage"], 0)
        self.assertEqual(get_networth_trend([{"net_worth": 0}, {"net_worth": 5000}])["change_percentage"], 100)

if __name__ == "__main__":
    unittest.main()
