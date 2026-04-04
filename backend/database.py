"""ARIA — SQLite Database Layer (no SQLAlchemy, zero extra dependencies)"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "aria.db"


def get_conn() -> sqlite3.Connection:
    # Ensure absolute path to proj root/data/aria.db
    abs_path = DB_PATH.resolve()
    print(f"📁 SQLite Connecting to: {abs_path}")
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(abs_path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            -- Standard Audit and History tables
            CREATE TABLE IF NOT EXISTS system_logs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                event       TEXT,
                details     TEXT,
                created_at  TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS documents (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL,
                type        TEXT,
                content     TEXT,
                created_at  TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                role        TEXT NOT NULL,
                content     TEXT NOT NULL,
                timestamp   TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS net_worth_entries (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                assets      REAL NOT NULL,
                liabilities REAL NOT NULL,
                net_worth   REAL NOT NULL,
                notes       TEXT,
                timestamp   TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS risk_profiles (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id             INTEGER DEFAULT 1,
                risk_score          INTEGER NOT NULL,
                risk_category       TEXT NOT NULL,
                behavior_answers    TEXT, -- JSON
                financial_snapshot  TEXT, -- JSON
                portfolio_snapshot  TEXT, -- JSON
                created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at          TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS portfolio_holdings (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_name      TEXT NOT NULL,
                asset_type      TEXT NOT NULL, -- equity, mutual_fund, crypto, bond, gold, cash
                ticker          TEXT,
                quantity        REAL NOT NULL DEFAULT 0,
                avg_price       REAL NOT NULL DEFAULT 0,
                current_price   REAL NOT NULL DEFAULT 0,
                sector          TEXT,
                created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
                last_updated    TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ingested_data (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                date            TEXT NOT NULL,
                asset_name      TEXT NOT NULL,
                value           REAL NOT NULL,
                category        TEXT NOT NULL,
                region          TEXT,
                is_processed    INTEGER DEFAULT 0, -- 0=pending, 1=synced to portfolio
                created_at      TEXT DEFAULT CURRENT_TIMESTAMP
            );
        """)
