import sys
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from services.portfolio.dashboard import PortfolioDashboardService

class TestPortfolioDashboard(unittest.TestCase):
    @patch('services.portfolio.dashboard.get_conn')
    def test_dashboard_aggregator(self, mock_get_conn):
        # Mock DB response
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn
        
        mock_holdings = [
            {"id": 1, "asset_name": "Nifty 50", "asset_type": "equity", "quantity": 100, "avg_price": 200, "current_price": 250}, # 20k -> 25k
            {"id": 2, "asset_name": "Gold ETF", "asset_type": "gold",   "quantity": 10,  "avg_price": 1000, "current_price": 1100}, # 10k -> 11k
        ]
        mock_conn.execute.return_value.fetchall.return_value = mock_holdings

        result = PortfolioDashboardService.generate()
        
        # Portfolio Value = 25k + 11k = 36k
        assert result["portfolio_value"] == 36000
        assert result["allocation"]["equity"] == 69.44 # 25/36 * 100
        assert result["allocation"]["gold"] == 30.56   # 11/36 * 100
        assert result["performance"]["profit"] == 6000 # 36k - 30k
        assert result["diversification"]["score"] == 40 # 2 types (-20), and 25k/36k = 69% (>60% penalty -40) = 40.

    @patch('services.portfolio.dashboard.get_conn')
    def test_dashboard_empty(self, mock_get_conn):
        mock_conn = MagicMock()
        mock_get_conn.return_value.__enter__.return_value = mock_conn
        mock_conn.execute.return_value.fetchall.return_value = []

        result = PortfolioDashboardService.generate()
        assert result["portfolio_value"] == 0
        assert result["allocation"] == {}

if __name__ == '__main__':
    unittest.main()
