import unittest
import sys
import os

# Add backend to sys.path to allow imports if running directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from services.risk.behavior import BehaviorAnalysisService

class TestBehaviorAnalysisService(unittest.TestCase):
    def test_long_horizon_aggressive(self):
        # High horizon, aggressive reaction, growth goal
        data = {
            "investment_horizon": 15,
            "reaction_to_market_drop": "buy more",
            "primary_goal": "wealth growth"
        }
        score = BehaviorAnalysisService.calculate(data)
        self.assertEqual(score, 100)

    def test_short_horizon_conservative(self):
        # Low horizon, panicked reaction, preservation goal
        data = {
            "investment_horizon": 2,
            "reaction_to_market_drop": "sell all",
            "primary_goal": "capital preservation"
        }
        score = BehaviorAnalysisService.calculate(data)
        # (20 + 0 + 20) / 3 = 13.33 -> 13
        self.assertEqual(score, 13)

    def test_mid_horizon_moderate(self):
        # Medium horizon, hold reaction, balanced goal
        data = {
            "investment_horizon": 5,
            "reaction_to_market_drop": "hold",
            "primary_goal": "balanced"
        }
        score = BehaviorAnalysisService.calculate(data)
        # (80 + 70 + 60) / 3 = 70
        # Wait, horizon 5: 100 if >= 15, 80 if >= 7, 50 if >= 3, else 20.
        # Horizon 5 -> 50.
        # (50 + 70 + 60) / 3 = 60
        self.assertEqual(score, 60)

if __name__ == '__main__':
    unittest.main()
