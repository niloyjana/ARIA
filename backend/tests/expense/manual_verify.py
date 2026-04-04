import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from services.expense.expense_analyzer import ExpenseAnalysisService

def run_test():
    print("🚀 Starting Manual Verification for ExpenseAnalysisService...")
    
    txns = [
        {"amount": 50000, "category": "Salary", "type": "income", "date": "2026-01-01"},
        {"amount": 25000, "category": "Rent", "type": "expense", "date": "2026-01-01"},
        {"amount": 5000, "category": "Food", "type": "expense", "date": "2026-01-05"},
        {"amount": 3000, "category": "Food", "type": "expense", "date": "2026-01-10"},
        {"amount": 2000, "category": "Transport", "type": "expense", "date": "2026-01-12"},
        {"amount": 52000, "category": "Salary", "type": "income", "date": "2026-02-01"},
        {"amount": 25000, "category": "Rent", "type": "expense", "date": "2026-02-01"},
    ]
    
    result = ExpenseAnalysisService.analyze(txns)
    
    # ── Verify Metrics ──
    print(f"\n📊 Totals:")
    print(f"Income: {result['income']} (Expected: 102000)")
    print(f"Expenses: {result['expenses']} (Expected: 60000)")
    print(f"Net Savings: {result['net_savings']} (Expected: 42000)")
    print(f"Savings Rate: {result['savings_rate']}% (Expected: 41.18)")
    
    assert result['income'] == 102000.0
    assert result['expenses'] == 60000.0
    assert result['savings_rate'] == 41.18
    
    # ── Verify Category Breakdown ──
    print(f"\n🍕 Category Breakdown:")
    for cat, amt in result['category_breakdown'].items():
        print(f" - {cat}: {amt}")
    assert result['category_breakdown']['Food'] == 8000.0
    
    # ── Verify Top Categories ──
    print(f"\n🔝 Top Categories:")
    for item in result['top_categories']:
        print(f" - {item['category']}: {item['amount']}")
    assert result['top_categories'][0]['category'] == "Rent"
    
    # ── Verify Monthly Trend ──
    print(f"\n📈 Monthly Trend:")
    for month, data in result['monthly_trend'].items():
        print(f" - {month}: {data}")
    assert result['monthly_trend']['2026-01']['income'] == 50000.0
    
    # ── Verify Largest Expense ──
    print(f"\n🏢 Largest Expense: {result['largest_expense']}")
    assert result['largest_expense']['amount'] == 25000.0
    
    print("\n✅ ALL MICRO-TESTS PASSED!")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        sys.exit(1)
