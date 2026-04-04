"""
Net Worth Calculator Module
Deterministic math for net worth and trend analysis.
"""

def calculate_networth(assets: float, liabilities: float) -> dict:
    """Calculate the current net worth."""
    if assets < 0 or liabilities < 0:
        return {"error": "Invalid financial values"}
    
    return {"net_worth": assets - liabilities}

def get_networth_trend(history: list) -> dict:
    """
    Calculate trend data and change percentage from historical entries.
    history: list of dicts with keys: date, assets, liabilities, net_worth
    """
    if not history:
        return {"history": [], "change_percentage": 0}
    
    # History is assumed to be sorted by date cronologically
    first = history[0]["net_worth"]
    latest = history[-1]["net_worth"]
    
    change_percentage = 0
    if first != 0:
        change_percentage = ((latest - first) / abs(first)) * 100
    elif latest != 0:
        change_percentage = 100 # From 0 to something
        
    return {
        "history": history,
        "change_percentage": round(change_percentage, 2)
    }
