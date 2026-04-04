import unittest
import sys
import os

# Add backend to sys.path to allow imports if running directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from services.risk.stability import FinancialStabilityService

class TestFinancialStabilityService(unittest.TestCase):
    def test_high_stability(self):
        # High savings, 6mo emergency fund, low debt
        data = {
            "savings_rate": 35,
            "emergency_fund_months": 8,
            "total_assets": 1000000,
            "total_liabilities": 100000 # 0.1 ratio
        }
        score = FinancialStabilityService.calculate(data)
        self.assertEqual(score, 100)

    def test_low_stability(self):
        # No savings, no emergency fund, high debt
        data = {
            "savings_rate": 0,
            "emergency_fund_months": 0,
            "total_assets": 100000,
            "total_liabilities": 80000 # 0.8 ratio
        }
        score = FinancialStabilityService.calculate(data)
        # Savings: 0, Emergency: 10, Debt/Equity: 20
        # (0 + 10 + 20) / 3 = 10
        self.assertEqual(score, 10)

if __name__ == '__main__':
    unittest.main()
