"""Portfolio Dashboard Calculator — Deterministic logic for the dashboard."""
from services.portfolio.dashboard import PortfolioDashboardService

def calculate_portfolio_dashboard():
    """
    Acts as the entry point for API analytics.
    Calls the DashboardService to generate the report.
    Returns: analytics dictionary
    """
    return PortfolioDashboardService.generate()
