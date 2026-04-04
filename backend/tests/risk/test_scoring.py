import unittest
import sys
import os

# Add backend to sys.path to allow imports if running directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from services.risk.scoring import RiskScoringService

class TestRiskScoringService(unittest.TestCase):
    def test_weighted_aggregation(self):
        # Behavior: 100 (40% weight = 40.0)
        # Stability: 50 (30% weight = 15.0)
        # Portfolio: 50 (30% weight = 15.0)
        # Total: 70.0 -> score 70
        profile = RiskScoringService.calculate(100, 50, 50)
        self.assertEqual(profile['risk_score'], 70)
        self.assertEqual(profile['category'], "Moderately Aggressive")
        self.assertEqual(profile['breakdown']['behavior'], 100)

    def test_mapping_categories(self):
        # 0-20: Very Conservative
        self.assertEqual(RiskScoringService.calculate(10, 10, 10)['category'], "Very Conservative")
        # 21-40: Conservative
        self.assertEqual(RiskScoringService.calculate(30, 30, 30)['category'], "Conservative")
        # 41-60: Moderate
        self.assertEqual(RiskScoringService.calculate(50, 50, 50)['category'], "Moderate")
        # 61-80: Moderately Aggressive
        self.assertEqual(RiskScoringService.calculate(70, 70, 70)['category'], "Moderately Aggressive")
        # 81-100: Aggressive
        self.assertEqual(RiskScoringService.calculate(90, 90, 90)['category'], "Aggressive")

if __name__ == '__main__':
    unittest.main()
