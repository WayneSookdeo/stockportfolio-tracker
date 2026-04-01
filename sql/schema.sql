-- ============================================================
-- Portfolio Tracker — PostgreSQL Schema
-- ============================================================

-- Watchlist: assets the user wants to track
CREATE TABLE IF NOT EXISTS watchlist (
    id              SERIAL PRIMARY KEY,
    symbol          VARCHAR(20) NOT NULL UNIQUE,   -- e.g. BTC, ETH, AAPL, NVDA
    name            VARCHAR(100) NOT NULL,          -- e.g. Bitcoin, Apple Inc.
    asset_type      VARCHAR(10) NOT NULL,           -- 'crypto' or 'stock'
    quantity        NUMERIC(18, 8) NOT NULL DEFAULT 0,  -- how many units you hold
    buy_price       NUMERIC(18, 8),                 -- your average buy price (USD)
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    added_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Price snapshots: one row per asset per day
CREATE TABLE IF NOT EXISTS price_history (
    id              SERIAL PRIMARY KEY,
    symbol          VARCHAR(20) NOT NULL REFERENCES watchlist(symbol) ON DELETE CASCADE,
    price_usd       NUMERIC(18, 8) NOT NULL,
    change_24h      NUMERIC(8, 4),                 -- percentage change over 24h
    market_cap      NUMERIC(24, 2),
    volume_24h      NUMERIC(24, 2),
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Digest log: track every WhatsApp message sent
CREATE TABLE IF NOT EXISTS digest_log (
    id              SERIAL PRIMARY KEY,
    message_sid     VARCHAR(100),                  -- Twilio message SID
    status          VARCHAR(50),                   -- sent, failed, etc.
    summary         TEXT,                          -- the message that was sent
    sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_price_history_symbol     ON price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_fetched_at ON price_history(fetched_at);

-- ============================================================
-- Analytical views
-- ============================================================

-- Latest price for each active asset
CREATE OR REPLACE VIEW vw_latest_prices AS
SELECT DISTINCT ON (ph.symbol)
    w.symbol,
    w.name,
    w.asset_type,
    w.quantity,
    w.buy_price,
    ph.price_usd                                        AS current_price,
    ph.change_24h,
    ROUND((ph.price_usd - w.buy_price) * w.quantity, 2) AS unrealised_pnl,
    ROUND(ph.price_usd * w.quantity, 2)                 AS current_value,
    ROUND(w.buy_price * w.quantity, 2)                  AS cost_basis,
    ph.fetched_at
FROM watchlist w
JOIN price_history ph ON ph.symbol = w.symbol
WHERE w.is_active = TRUE
ORDER BY ph.symbol, ph.fetched_at DESC;

-- Portfolio summary
CREATE OR REPLACE VIEW vw_portfolio_summary AS
SELECT
    COUNT(*)                            AS total_assets,
    ROUND(SUM(current_value), 2)        AS total_value_usd,
    ROUND(SUM(cost_basis), 2)           AS total_cost_basis,
    ROUND(SUM(unrealised_pnl), 2)       AS total_pnl,
    ROUND(
        (SUM(current_value) - SUM(cost_basis)) / NULLIF(SUM(cost_basis), 0) * 100,
    2)                                  AS total_pnl_percentage
FROM vw_latest_prices;

-- 7-day price trend per asset
CREATE OR REPLACE VIEW vw_price_trend_7d AS
SELECT
    symbol,
    DATE(fetched_at)    AS date,
    AVG(price_usd)      AS avg_price
FROM price_history
WHERE fetched_at >= NOW() - INTERVAL '7 days'
GROUP BY symbol, DATE(fetched_at)
ORDER BY symbol, date;

-- ============================================================
-- Seed data — your starting watchlist
-- Edit quantities and buy prices to match yours
-- ============================================================

INSERT INTO watchlist (symbol, name, asset_type, quantity, buy_price) VALUES
    ('BTC',  'Bitcoin',    'crypto', 0.01,  60000.00),
    ('ETH',  'Ethereum',   'crypto', 0.5,   3000.00),
    ('AAPL', 'Apple Inc.', 'stock',  2,     175.00),
    ('NVDA', 'NVIDIA',     'stock',  1,     800.00)
ON CONFLICT (symbol) DO NOTHING;