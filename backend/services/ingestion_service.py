import pandas as pd
import sqlite3
from io import StringIO
from typing import List, Dict, Any
from datetime import datetime
try:
    from backend.database import get_conn
except ImportError:
    from database import get_conn

class IngestionService:
    # Fuzzy column mapping for better resilience
    COLUMN_MAP = {
        'date': ['date', 'timestamp', 'txn_date', 'time', 'dt'],
        'asset_name': ['asset', 'name', 'asset_name', 'description', 'particulars', 'desc'],
        'value': ['value', 'amount', 'price', 'total', 'amt', 'val'],
        'category': ['category', 'group', 'cat', 'classification'],
        'type': ['type', 'transaction_type', 'kind', 'typ'],
        'region': ['region', 'location', 'country', 'city', 'loc']
    }

    @staticmethod
    def parse_csv(csv_content: str) -> List[Dict[str, Any]]:
        # Use first line to detect delimiter (common issue)
        first_line = csv_content.split('\n')[0]
        sep = ';' if ';' in first_line and ',' not in first_line else ','
        
        df = pd.read_csv(StringIO(csv_content), sep=sep)
        print(f"📄 Raw CSV Columns: {df.columns.tolist()}")

        # ── 1. Robust Column Normalization ─────────────────────────
        normalized_cols = {c: c.lower().strip().replace(" ", "_") for c in df.columns}
        df = df.rename(columns=normalized_cols)
        
        # ── 2. Precise Fuzzy Mapping ────────────────────────────────
        # Use a more careful mapping to avoid overlaps
        final_mapping = {}
        for target, aliases in IngestionService.COLUMN_MAP.items():
            for col in df.columns:
                if col in aliases and col not in final_mapping:
                    final_mapping[col] = target
                    break
        
        df = df.rename(columns=final_mapping)
        print(f"🔎 Mapped Columns: {final_mapping}")

        # Check required columns
        required = ["date", "asset_name", "value"] # category is optional now
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"CSV missing required info: {', '.join(missing)}. Detected: {list(final_mapping.keys())}")
            
        # ── 3. Data Cleaning ─────────────────────────────────────────
        df = df.dropna(subset=required)
        
        # Robust Date Parsing
        try:
            df['date'] = pd.to_datetime(df['date'], errors='coerce').dt.strftime('%Y-%m-%d')
            df['date'] = df['date'].fillna(datetime.now().strftime('%Y-%m-%d'))
        except:
            df['date'] = df['date'].astype(str).str.split(' ').str[0]
        
        # Clean Value (Amount)
        df['value'] = pd.to_numeric(df['value'].astype(str).str.replace(r'[^\d.-]', '', regex=True), errors='coerce')
        df = df.dropna(subset=['value'])
        
        # Defaults for optional
        if 'category' not in df.columns: df['category'] = "Misc"
        if 'type' not in df.columns: df['type'] = "expense"
        if 'region' not in df.columns: df['region'] = "Global"

        df['category'] = df['category'].fillna("Misc")
        df['type'] = df['type'].fillna("expense")
        df['region'] = df['region'].fillna("Global")

        # ── 4. Save to Database ──────────────────────────────────────
        records = df.to_dict(orient='records')
        print(f"🔍 Parsing complete. Ingesting {len(records)} records...")

        with get_conn() as conn:
            cursor = conn.cursor()
            for row in records:
                # Map to existing transaction schema for UI compatibility
                desc = str(row.get('asset_name') or 'Unnamed Item')
                amt = float(row.get('value') or 0.0)
                cat = str(row.get('category', 'Misc'))
                
                # Use type from CSV if valid, otherwise derive from value sign
                typ = str(row.get('type', 'expense')).lower()
                if typ not in ['income', 'expense']:
                    typ = 'expense' if amt < 0 else 'income'
                
                # If type is expense, ensure stored value reflects that for sign-based math
                stored_val = -abs(amt) if typ == 'expense' else abs(amt)
                
                cursor.execute("""
                    INSERT INTO ingested_data (date, asset_name, value, category, region) 
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    str(row.get('date')),
                    desc,
                    stored_val,
                    cat,
                    str(row.get('region', 'Global'))
                ))
            conn.commit()
            print(f"✅ Transaction batch committed to SQLite.")
            
        return records

    @staticmethod
    def get_processed_data() -> List[Dict[str, Any]]:
        """Returns cleaned + structured JSON compatible with Transactions UI."""
        with get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, date, asset_name as description, ABS(value) as amount, category, 
                       (CASE WHEN value < 0 THEN 'expense' ELSE 'income' END) as type,
                       region 
                FROM ingested_data 
                WHERE value IS NOT NULL
                ORDER BY date DESC
            """)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def clear_all_data():
        """Wipes all transactions from SQLite."""
        with get_conn() as conn:
            conn.execute("DELETE FROM ingested_data")
            conn.commit()

    @staticmethod
    def delete_by_id(id: int):
        """Deletes a specific record from SQLite."""
        with get_conn() as conn:
            conn.execute("DELETE FROM ingested_data WHERE id = ?", (id,))
            conn.commit()

ingestion_service = IngestionService()
