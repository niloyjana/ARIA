/**
 * ARIA Transactions Module v1.1
 * 💸 Handles UI for listing, filtering, and Export/Import transactions.
 */

const Transactions = {
    initialized: false,

    init() {
        if (this.initialized) return;
        console.log("💳 Transactions Module Initialized");
        this.populateCategories();
        this.bindEvents();
        this.refreshUI();
        this.initialized = true;
    },

    bindEvents() {
        const clearBtn = document.getElementById('btn-clear-ledger');
        const importBtn = document.getElementById('btn-import-csv');
        const fileInput = document.getElementById('csv-import-input');

        clearBtn?.addEventListener('click', () => this.wipeAll());
        importBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => this.importCSV(e));
        
        // Handle dropdown toggle for export
        const exportBtn = document.getElementById('btn-export-main');
        const exportContent = document.getElementById('export-dropdown-content');

        exportBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            exportContent?.classList.toggle('active');
        });

        // Click outside to close dropdown
        document.addEventListener('click', () => {
            exportContent?.classList.remove('active');
        });
    },

    async refreshUI() {
        await appState.syncWithBackend();
        this.renderTransactions();
        this.updateDashboard();
        this.renderDashboardCharts();
        this.updateInsights();
        this.updateRoleUI();
    },

    renderTransactions() {
        const listBody = document.getElementById('txn-list-body');
        const emptyState = document.getElementById('txn-empty-state');
        if (!listBody) return;

        const txns = appState.getFilteredTransactions();
        
        if (txns.length === 0) {
            listBody.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');
        listBody.innerHTML = txns.map(t => `
            <tr class="txn-row">
                <td>${this.formatDate(t.date)}</td>
                <td><div class="txn-desc">${t.description}</div></td>
                <td><span class="txn-cat-tag">${t.category}</span></td>
                <td class="text-right ${t.type === 'income' ? 'text-green' : 'text-red'}">
                    ${t.type === 'income' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}
                </td>
                <td><span class="txn-type-badge type-${t.type}">${t.type}</span></td>
                <td><button onclick="Transactions.deleteTransaction('${t.id}')" title="Delete transaction" style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.2);padding:4px 8px;border-radius:6px;transition:color 0.2s;font-size:14px;line-height:1;" onmouseenter="this.style.color='#ef4444'" onmouseleave="this.style.color='rgba(255,255,255,0.2)'">&#x2715;</button></td>
            </tr>
        `).join('');
    },

    updateDashboard() {
        const balanceEl = document.getElementById('db-balance');
        const incomeEl = document.getElementById('db-income');
        const expenseEl = document.getElementById('db-expenses');
        const savingsRateEl = document.getElementById('db-savings-rate');
        const savedAmountEl = document.getElementById('db-saved-amount');
        const toolCountEl = document.getElementById('db-tool-count');
        const costEl = document.getElementById('db-cost');
        const progressFill = document.getElementById('db-progress-fill');

        const income = appState.getTotalIncome();
        const expenses = appState.getTotalExpenses();
        const balance = income - expenses;
        const savingsRate = income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : "0.0";

        if (balanceEl) balanceEl.textContent = `₹${balance.toLocaleString('en-IN')}`;
        if (incomeEl) incomeEl.textContent = `₹${income.toLocaleString('en-IN')}`;
        if (expenseEl) expenseEl.textContent = `₹${expenses.toLocaleString('en-IN')}`;
        if (savingsRateEl) savingsRateEl.textContent = `${savingsRate}%`;

        if (savedAmountEl) {
            savedAmountEl.innerHTML = `₹${balance.toLocaleString('en-IN')} <span class="wallet-sub">available balance</span>`;
        }
        if (toolCountEl) toolCountEl.textContent = appState.transactions.length;
        if (costEl) costEl.textContent = `₹${expenses.toLocaleString('en-IN')}`;

        if (progressFill) {
            progressFill.style.width = (income === 0 && expenses === 0) ? '100%' : `${100 - (income > 0 ? Math.min(100, (expenses/income)*100) : 100)}%`;
        }
    },

    renderDashboardCharts() {
        const monthlyCtx = document.getElementById('chart-monthly-trends');
        const categoryCtx = document.getElementById('chart-category-breakdown');
        if (!monthlyCtx || !categoryCtx) return;

        if (this.monthlyChartInstance) this.monthlyChartInstance.destroy();
        if (this.categoryChartInstance) this.categoryChartInstance.destroy();

        const monthlyData = appState.getMonthlyTotals();
        this.monthlyChartInstance = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [
                    { label: 'Income', data: monthlyData.map(d => d.income), borderColor: '#00B894', tension: 0.4, fill: false },
                    { label: 'Expenses', data: monthlyData.map(d => d.expense), borderColor: '#FF6B35', tension: 0.4, fill: false }
                ]
            },
            options: this.getChartOptions()
        });

        const categoryData = appState.getSpendingByCategory();
        this.categoryChartInstance = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: ['#FF6B35', '#00B894', '#6C5CE7', '#FDCB6E', '#E84393', '#00CEC9', '#a855f7']
                }]
            },
            options: {
                ...this.getChartOptions(),
                cutout: '70%',
                plugins: { ...this.getChartOptions().plugins, legend: { display: true, position: 'bottom' } }
            }
        });
    },

    updateInsights() {
        const topCatEl = document.getElementById('insight-top-cat');
        const momEl = document.getElementById('insight-mom');
        const ratioBar = document.getElementById('insight-ratio-bar');
        const ratioText = document.getElementById('insight-ratio-text');
        const rankList = document.getElementById('insight-rank-list');

        const categoryData = appState.getSpendingByCategory();
        const cats = Object.keys(categoryData);
        const topCat = cats.length > 0 ? cats.reduce((a, b) => categoryData[a] > categoryData[b] ? a : b) : "N/A";
        if (topCatEl) topCatEl.textContent = topCat;

        const monthlyData = appState.getMonthlyTotals();
        if (monthlyData.length >= 2) {
            const current = monthlyData[monthlyData.length - 1].expense;
            const previous = monthlyData[monthlyData.length - 2].expense;
            const diff = previous > 0 ? ((current - previous) / previous * 100) : 0;
            const diffText = diff > 0 ? `+${diff.toFixed(1)}% 📈` : `${diff.toFixed(1)}% 📉`;
            if (momEl) {
                momEl.textContent = diffText;
                momEl.className = `insight-value ${diff > 0 ? 'text-red' : 'text-green'}`;
            }
        } else if (momEl) momEl.textContent = "Neutral";

        if (rankList) {
            const sortedCats = cats.sort((a, b) => categoryData[b] - categoryData[a]).slice(0, 3);
            const totalExp = appState.getTotalExpenses();
            rankList.innerHTML = sortedCats.map((c, i) => `
                <div class="rank-item">
                    <span class="rank-num">#${i + 1}</span>
                    <span class="rank-label">${c}</span>
                    <span class="rank-pct">${((categoryData[c]/totalExp)*100).toFixed(0)}%</span>
                    <span class="rank-amt">₹${categoryData[c].toLocaleString()}</span>
                </div>
            `).join('');
        }

        if (ratioBar && ratioText) {
            const income = appState.getTotalIncome();
            const expenses = appState.getTotalExpenses();
            const ratio = income > 0 ? Math.min(100, (expenses / income) * 100) : 0;
            ratioBar.style.width = `${ratio}%`;
            ratioText.textContent = `${ratio.toFixed(0)}% of income spent`;
        }
    },

    updateRoleUI() {
        const toggle  = document.getElementById('role-toggle-input');
        const addBtn  = document.getElementById('add-txn-btn');
        const isAdmin = appState.activeRole === 'admin';

        // Only Add Transaction is admin-gated
        if (addBtn) addBtn.style.display = isAdmin ? 'flex' : 'none';

        isAdmin ? toggle?.classList.add('active') : toggle?.classList.remove('active');
        document.querySelector('.admin-label')?.classList.toggle('active', isAdmin);
        document.querySelector('.viewer-label')?.classList.toggle('active', !isAdmin);

        const nav = document.getElementById('role-switcher-nav');
        isAdmin ? nav?.classList.add('is-admin') : nav?.classList.remove('is-admin');
    },

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
            }
        };
    },

    handleFilterChange() {
        appState.setFilter('search', document.getElementById('txn-search').value);
        appState.setFilter('type', document.getElementById('filter-type').value);
        appState.setFilter('category', document.getElementById('filter-category').value);
        appState.setFilter('sortBy', document.getElementById('filter-sort').value);
        this.renderTransactions();
    },

    populateCategories() {
        const select = document.getElementById('filter-category');
        if (!select) return;
        const categories = [...new Set(appState.transactions.map(t => t.category))];
        select.innerHTML = '<option value="all">All Categories</option>' + 
            categories.map(c => `<option value="${c}">${c}</option>`).join('');
    },

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // ── Export Logic ──

    exportCSV() {
        const txns = appState.transactions;
        const headers = ["Date", "Description", "Amount", "Category", "Type"];
        const rows = txns.map(t => [t.date, `"${t.description}"`, t.amount, t.category, t.type].join(","));
        const csvContent = [headers.join(","), ...rows].join("\n");
        this.downloadFile(csvContent, "csv");
    },

    exportJSON() {
        this.downloadFile(JSON.stringify(appState.transactions, null, 2), "json");
    },

    downloadFile(content, format) {
        const date = new Date().toISOString().split('T')[0];
        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ARIA_Transactions_${date}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Visual feedback
        const badge = document.getElementById('csv-filename-badge');
        const nameEl = document.getElementById('csv-filename-text');
        if (badge && nameEl) {
            nameEl.textContent = `Processing ${file.name}...`;
            badge.style.display = 'flex';
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/data/upload-csv', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMsg = result.detail || "Column Mismatch. Ensure your CSV has: Date, Description, and Amount.";
                throw new Error(errorMsg);
            }

            console.log("✅ Data ingested successfully into ARIA Backend.");
            await this.refreshUI();
            
            // Re-show filename for success confirmation
            if (nameEl) nameEl.textContent = file.name;
            setTimeout(() => this.clearFileSelection(), 3000);

        } catch (error) {
            alert(error.message);
            this.clearFileSelection();
        }
    },

    clearFileSelection() {
        const badge = document.getElementById('csv-filename-badge');
        const input = document.getElementById('csv-import-input');
        if (badge) badge.style.display = 'none';
        if (input) input.value = '';
    },

    async deleteTransaction(id) {
        if (!id || !confirm('Delete this transaction?')) return;
        try {
            const response = await fetch(`/api/data/transactions/${id}`, { method: 'DELETE' });
            if (response.ok) {
                console.log(`✅ Transaction ${id} deleted from backend.`);
                await this.refreshUI();
            }
        } catch (e) {
            console.error("❌ Failed to delete transaction:", e);
        }
    },

    async wipeAll() {
        if (confirm("⚠️ Clear entire ledger? This cannot be undone.")) {
            try {
                const response = await fetch('/api/data/transactions', { method: 'DELETE' });
                if (response.ok) {
                    localStorage.removeItem('aria-transactions');
                    console.log("🗑️ Ledger wiped from backend.");
                    await this.refreshUI();
                    this.populateCategories();
                    alert("Ledger cleared.");
                }
            } catch (e) {
                console.error("❌ Failed to wipe ledger:", e);
            }
        }
    }
};

window.Transactions = Transactions;

function handleTxnFilterChange() { Transactions.handleFilterChange(); }
function toggleRole() {
    const newRole = appState.activeRole === 'admin' ? 'viewer' : 'admin';
    appState.setRole(newRole);
    Transactions.updateRoleUI();
}
function openAddTransactionModal() {
    // Basic modal implementation as requested in original logic
    const tool = {
        title: "New Transaction", subtitle: "Add manual entry to ledger", color: "#a855f7", btnText: "Add Transaction",
        fields: [
            { key: "description", label: "Description", type: "text", placeholder: "e.g. Starbucks" },
            { key: "amount", label: "Amount (₹)", type: "number", placeholder: "0" },
            { key: "category", label: "Category", type: "select", options: ["Food & Dining", "Rent", "Salary", "Investment", "Shopping", "Others"] },
            { key: "type", label: "Type", type: "select", options: ["expense", "income"] },
            { key: "date", label: "Date", type: "text", placeholder: "YYYY-MM-DD" }
        ]
    };
    currentTool = 'custom-txn';
    document.getElementById("modal-content").innerHTML = buildForm(tool);
    document.getElementById("modal-overlay").classList.remove("hidden");
    document.getElementById('submit-btn').onclick = () => {
        const payload = {};
        tool.fields.forEach(f => {
            const el = document.getElementById(`field-${f.key}`);
            payload[f.key] = f.type === "number" ? parseFloat(el.value) : el.value;
        });
        if (appState.addTransaction(payload)) {
            closeToolModal();
            Transactions.refreshUI();
            Transactions.populateCategories();
        }
    };
}
