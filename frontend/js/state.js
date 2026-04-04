/**
 * ARIA Centralized State Management v1.1
 * 🏦 Core data store with Local Storage Persistence.
 */

const DEFAULT_TRANSACTIONS = [
  { id: 'tx-001', date: '2026-01-01', description: 'Monthly Rent', amount: 20000, category: 'Rent', type: 'expense' },
  { id: 'tx-002', date: '2026-01-05', description: 'Salary Deposit', amount: 85000, category: 'Salary', type: 'income' },
  { id: 'tx-003', date: '2026-01-10', description: 'BigBasket Groceries', amount: 4500, category: 'Food & Dining', type: 'expense' },
  { id: 'tx-004', date: '2026-01-15', description: 'Netflix Subscription', amount: 499, category: 'Entertainment', type: 'expense' },
  { id: 'tx-005', date: '2026-01-20', description: 'Amazon Shopping', amount: 2300, category: 'Shopping', type: 'expense' },
  { id: 'tx-006', date: '2026-02-01', description: 'Monthly Rent', amount: 20000, category: 'Rent', type: 'expense' },
  { id: 'tx-007', date: '2026-02-05', description: 'Quarterly Dividends', amount: 1200, category: 'Investment', type: 'income' },
  { id: 'tx-008', date: '2026-02-12', description: 'Cult.fit Gym Membership', amount: 1500, category: 'Health', type: 'expense' },
  { id: 'tx-009', date: '2026-03-05', description: 'Restaurant Dinner', amount: 3200, category: 'Food & Dining', type: 'expense' },
  { id: 'tx-010', date: '2026-03-25', description: 'Performance Bonus', amount: 15000, category: 'Salary', type: 'income' }
];

const appState = {
  // ── Persistent Data ──────────────────────────────────
  transactions: (() => {
    const saved = localStorage.getItem('aria-transactions');
    const wiped = localStorage.getItem('aria-data-wiped') === 'true';
    if (wiped) return [];
    if (!saved || saved === '[]') return [...DEFAULT_TRANSACTIONS];
    try { return JSON.parse(saved); } catch(e) { return [...DEFAULT_TRANSACTIONS]; }
  })(),
  activeRole: localStorage.getItem('aria-role') || 'viewer', // 'admin' or 'viewer'
  dataWiped: localStorage.getItem('aria-data-wiped') === 'true',
  
  currentFilters: {
    search: '',
    type: 'all',
    category: 'all',
    sortBy: 'date-desc'
  },

  // ── Persistence Logic ───────────────────────────────
  
  /**
   * Saves sensitive state to localStorage
   */
  persistState() {
    localStorage.setItem('aria-transactions', JSON.stringify(this.transactions));
    localStorage.setItem('aria-role', this.activeRole);
    localStorage.setItem('aria-data-wiped', this.dataWiped ? 'true' : 'false');
    console.log("💾 State persisted to LocalStorage.");
  },

  /**
   * Resets the entire ledger and storage to mock defaults
   */
  async resetState() {
    if (confirm("⚠️ This will permanently delete all your changes and clear the dashboard. Status will stay at 0 until you upload data. Proceed?")) {
      try {
          // Clear backend first
          await fetch('/api/data/transactions', { method: 'DELETE' });
      } catch (e) {
          console.error("Failed to clear backend during reset:", e);
      }
      
      localStorage.removeItem('aria-transactions');
      this.transactions = [];
      this.dataWiped = true;
      this.persistState();
      window.location.reload(); 
    }
  },

  // ── State Helper Functions ───────────────────────────

  getFilteredTransactions() {
    if (!Array.isArray(this.transactions)) return [];
    
    let filtered = this.transactions.filter(t => {
      const description = (t.description || t.asset_name || "Untitled").toLowerCase();
      const matchesSearch = description.includes((this.currentFilters.search || "").toLowerCase());
      
      const type = (t.type || "expense").toLowerCase();
      const matchesType = this.currentFilters.type === 'all' || type === this.currentFilters.type;
      
      const category = (t.category || "Misc").toLowerCase();
      const matchesCategory = this.currentFilters.category === 'all' || category === this.currentFilters.category.toLowerCase();
      
      return matchesSearch && matchesType && matchesCategory;
    });

    return (filtered || []).sort((a, b) => {
      if (this.currentFilters.sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (this.currentFilters.sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (this.currentFilters.sortBy === 'amount-desc') return b.amount - a.amount;
      if (this.currentFilters.sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  },

  getTotalBalance() { return this.getTotalIncome() - this.getTotalExpenses(); },
  getTotalIncome() { return this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); },
  getTotalExpenses() { return this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); },

  getSpendingByCategory() {
    const expenses = this.transactions.filter(t => t.type === 'expense');
    return expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  },

  getMonthlyTotals() {
    const monthlyData = {};
    this.transactions.forEach(t => {
      const month = t.date.substring(0, 7); // 'YYYY-MM'
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
      if (t.type === 'income') monthlyData[month].income += t.amount;
      else monthlyData[month].expense += t.amount;
    });

    return Object.keys(monthlyData).sort().map(month => ({
      month,
      income: monthlyData[month].income,
      expense: monthlyData[month].expense
    }));
  },

  // ── Mutators ──────────────────────────────────────────

  addTransaction(txn) {
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.transactions.push({ id, ...txn });
    this.persistState();
    return true;
  },

  setRole(role) {
    if (['admin', 'viewer'].includes(role)) {
      this.activeRole = role;
      this.persistState();
    }
  },

  setFilter(key, value) {
    if (this.currentFilters.hasOwnProperty(key)) {
      this.currentFilters[key] = value;
    }
  },

  async syncWithBackend() {
    try {
        const response = await fetch('/api/data/processed');
        const result = await response.json();
        if (response.ok && result.data) {
            this.transactions = result.data;
            if (result.data.length > 0) this.dataWiped = false; // Reset wiped flag if real data arrives
            this.persistState();
            console.log(`🏦 State synchronized with backend: ${result.data.length} records.`);
            return true;
        }
    } catch (e) {
        console.error("❌ Backend sync failed:", e);
    }
    return false;
  }
};

console.log("🏦 ARIA Initialized with appState:", appState);
