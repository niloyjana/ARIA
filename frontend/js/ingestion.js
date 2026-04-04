/**
 * ARIA Data Ingestion System v1.0
 * 🚀 Handles CSV uploads, backend processing integration, and real-time data preview.
 */

const DataIngestion = {
    selectedFile: null,

    init() {
        console.log("📊 Data Engine Initialized");
        this.fetchRecentData();
    },

    handleFileSelect(input) {
        const file = input.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            this.showError("Please select a valid CSV file.");
            this.selectedFile = null;
            return;
        }

        this.selectedFile = file;
        this.clearError();
        
        const statusEl = document.getElementById('csv-ingest-status');
        if (statusEl) statusEl.textContent = `Selected: ${file.name}`;
        
        const uploadBtn = document.getElementById('csv-upload-btn');
        if (uploadBtn) uploadBtn.disabled = false;
    },

    async uploadCSV() {
        if (!this.selectedFile) return;

        const uploadBtn = document.getElementById('csv-upload-btn');
        const statusEl = document.getElementById('csv-ingest-status');
        const errorEl = document.getElementById('ingest-error-msg');

        // UI Feedback
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="spinner"></span> Processing...';
        statusEl.textContent = "Uploading to ARIA Backend...";

        const formData = new FormData();
        formData.append('file', this.selectedFile);

        try {
            const response = await fetch('/api/data/upload-csv', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.detail || "Upload failed");

            // Success
            this.showSuccess(`Ingested ${result.data.length} records successfully.`);
            this.selectedFile = null;
            document.getElementById('csv-ingest-file').value = '';
            uploadBtn.innerHTML = 'Data Ingested ✅';
            
            // Refresh systems
            this.fetchRecentData();
            
            // Notify other systems (Portfolio, Dashboard)
            if (window.Transactions) Transactions.refreshUI();
            
        } catch (error) {
            this.showError(error.message);
            uploadBtn.innerHTML = 'Retry Upload';
            uploadBtn.disabled = false;
        }
    },

    async fetchRecentData() {
        try {
            const response = await fetch('/api/data/processed');
            const result = await response.json();
            
            if (response.ok && result.data) {
                this.renderPreview(result.data);
            }
        } catch (error) {
            console.error("❌ Failed to fetch processed data:", error);
        }
    },

    renderPreview(data) {
        const body = document.getElementById('ingest-preview-body');
        if (!body) return;

        if (data.length === 0) {
            body.innerHTML = '<tr><td colspan="4" class="empty-row">No records found.</td></tr>';
            return;
        }

        body.innerHTML = data.slice(0, 10).map(row => `
            <tr>
                <td class="td-date">${row.date}</td>
                <td class="td-asset">${row.asset_name}</td>
                <td class="td-value font-mono">₹${parseFloat(row.value).toLocaleString('en-IN')}</td>
                <td class="td-cat"><span class="cat-tag">${row.category}</span></td>
            </tr>
        `).join('');
    },

    showError(msg) {
        const errorEl = document.getElementById('ingest-error-msg');
        if (errorEl) {
            errorEl.textContent = `❌ ${msg}`;
            errorEl.classList.remove('hidden');
            errorEl.style.color = "#ff4d4d";
        }
    },

    showSuccess(msg) {
        const errorEl = document.getElementById('ingest-error-msg');
        if (errorEl) {
            errorEl.textContent = `✅ ${msg}`;
            errorEl.classList.remove('hidden');
            errorEl.style.color = "#4ade80";
        }
    },

    clearError() {
        const errorEl = document.getElementById('ingest-error-msg');
        if (errorEl) errorEl.classList.add('hidden');
    }
};

// Auto-init on script load
document.addEventListener('DOMContentLoaded', () => DataIngestion.init());
