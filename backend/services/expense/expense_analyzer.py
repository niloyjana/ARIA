"""
ARIA — Expense Analysis Service
Handles deterministic spending aggregation, category breakdown, and monthly trends.
"""

class ExpenseAnalysisService:
    @staticmethod
    def analyze(transactions: list) -> dict:
        """
        Analyze a list of transactions and compute financial metrics.
        Input format: [{"amount": float, "category": str, "type": "income"|"expense", "date": "YYYY-MM-DD"}]
        """
        # 1. Filter & Validate
        valid_txns = [
            t for t in transactions 
            if isinstance(t, dict) and t.get("type") in ["income", "expense"]
        ]
        
        if not valid_txns:
            return {
                "income": 0.0,
                "expenses": 0.0,
                "net_savings": 0.0,
                "savings_rate": 0.0,
                "category_breakdown": {},
                "top_categories": [],
                "monthly_trend": {},
                "largest_expense": {}
            }

        income = 0.0
        expenses = 0.0
        cat_breakdown = {}
        monthly_trend = {}
        largest_exp_val = -1.0
        largest_exp_obj = {}

        for t in valid_txns:
            amt = float(t.get("amount", 0))
            is_income = t["type"] == "income"
            cat = t.get("category", "Others")
            date = t.get("date", "2026-01-01")
            month = date[:7] # YYYY-MM

            # Update Income/Expense totals
            if is_income:
                income += amt
            else:
                expenses += amt
                # Update category breakdown
                cat_breakdown[cat] = cat_breakdown.get(cat, 0.0) + amt
                # Check for largest expense
                if amt > largest_exp_val:
                    largest_exp_val = amt
                    largest_exp_obj = {"category": cat, "amount": amt, "date": date}

            # Update Monthly Trend
            if month not in monthly_trend:
                monthly_trend[month] = {"income": 0.0, "expenses": 0.0}
            
            if is_income:
                monthly_trend[month]["income"] += amt
            else:
                monthly_trend[month]["expenses"] += amt

        # 2. Derive Metrics
        net_savings = income - expenses
        savings_rate = (net_savings / income * 100) if income > 0 else 0.0
        
        # 3. Top Categories (sorted descending)
        top_cats = sorted(
            [{"category": k, "amount": v} for k, v in cat_breakdown.items()],
            key=lambda x: x["amount"],
            reverse=True
        )[:5]

        return {
            "income": float(income),
            "expenses": float(expenses),
            "net_savings": float(net_savings),
            "savings_rate": round(float(savings_rate), 2),
            "category_breakdown": cat_breakdown,
            "top_categories": top_cats,
            "monthly_trend": monthly_trend,
            "largest_expense": largest_exp_obj
        }
