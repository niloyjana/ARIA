import unittest
import sys
import os

# Add backend to sys.path to allow imports if running directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from services.risk.portfolio import PortfolioRiskService

class TestPortfolioRiskService(unittest.TestCase):
    def test_conservative_allocation(self):
        # Low equity, 0 crypto, high diversification
        data = {
            "equity_percentage": 20,
            "crypto_percentage": 0,
            "diversification_score": 90
        }
        score = PortfolioRiskService.calculate(data)
        # Equity: 20, Crypto: 0, Diversification Risk (100-90): 10
        # Average: (20 + 0 + 10) / 3 = 10
        self.assertEqual(score, 10)

    def test_high_crypto_allocation(self):
        # High equity, high crypto, low diversification
        data = {
            "equity_percentage": 90,
            "crypto_percentage": 20,
            "diversification_score": 20
        }
        score = PortfolioRiskService.calculate(data)
        # Equity: 90, Crypto (20 * 5): 100, Diversification Risk (100-20): 80
        # Average: (90 + 100 + 80) / 3 = 90
        self.assertEqual(score, 90)

if __name__ == '__main__':
    unittest.main()
