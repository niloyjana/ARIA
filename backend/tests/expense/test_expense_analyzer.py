import pytest
from services.expense.expense_analyzer import ExpenseAnalysisService

def test_income_calculation():
    txns = [
        {"amount": 50000, "category": "Salary", "type": "income", "date": "2026-01-01"},
        {"amount": 10000, "category": "Bonus", "type": "income", "date": "2026-01-15"}
    ]
    result = ExpenseAnalysisService.analyze(txns)
    assert result["income"] == 60000.0

def test_expense_calculation():
    txns = [
        {"amount": 25000, "category": "Rent", "type": "expense", "date": "2026-01-01"},
        {"amount": 5000, "category": "Food", "type": "expense", "date": "2026-01-05"}
    ]
    result = ExpenseAnalysisService.analyze(txns)
    assert result["expenses"] == 30000.0

def test_savings_rate():
    txns = [
        {"amount": 100000, "category": "Salary", "type": "income", "date": "2026-01-01"},
        {"amount": 30000, "category": "Expenses", "type": "expense", "date": "2026-01-15"}
    ]
    result = ExpenseAnalysisService.analyze(txns)
    # (100000 - 30000) / 100000 * 100 = 70%
    assert result["savings_rate"] == 70.0

def test_zero_income_savings_rate():
    txns = [
        {"amount": 5000, "category": "Food", "type": "expense", "date": "2026-01-01"}
    ]
    result = ExpenseAnalysisService.analyze(txns)
    assert result["savings_rate"] == 0.0

def test_category_aggregation():
    txns = [
        {"amount": 2000, "category": "Food", "type": "expense", "date": "2026-01-01"},
        {"amount": 3000, "category": "Food", "type": "expense", "date": "2026-01-05"},
        {"amount": 5000, "category": "Rent", "type": "expense", "date": "2026-01-01"}
    ]
    result = ExpenseAnalysisService.analyze(txns)
    assert result["category_breakdown"]["Food"] == 5000.0
    assert result["category_breakdown"]["Rent"] == 5000.0
    assert len(result["top_categories"]) == 2

def test_monthly_trend_grouping():
    txns = [
        {"amount": 10000, "category": "S1", "type": "income", "date": "2026-01-01"},
        {"amount": 5000, "category": "E1", "type": "expense", "date": "2026-01-15"},
        {"amount": 12000, "category": "S2", "type": "income", "date": "2026-02-01"}
    ]
    result = ExpenseAnalysisService.analyze(txns)
    assert result["monthly_trend"]["2026-01"]["income"] == 10000.0
    assert result["monthly_trend"]["2026-01"]["expenses"] == 5000.0
    assert result["monthly_trend"]["2026-02"]["income"] == 12000.0

def test_empty_transactions():
    result = ExpenseAnalysisService.analyze([])
    assert result["income"] == 0.0
    assert result["top_categories"] == []
