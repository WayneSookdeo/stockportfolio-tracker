import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALPHA_VANTAGE_KEY = Deno.env.get("ALPHA_VANTAGE_KEY")!;

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

// CoinGecko uses its own IDs — add more if you expand your watchlist
const CRYPTO_SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Fetch active watchlist from Supabase ---
async function getWatchlist() {
  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("is_active", true);

  if (error) throw new Error(`Failed to fetch watchlist: ${error.message}`);

  const crypto = data.filter((a) => a.asset_type === "crypto");
  const stocks = data.filter((a) => a.asset_type === "stock");
  return { crypto, stocks };
}

// --- Sleep helper ---
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Fetch crypto prices from CoinGecko with retry ---
async function fetchCryptoPrices(symbols: string[]) {
  if (!symbols.length) return {};

  const ids = symbols
    .map((s) => CRYPTO_SYMBOL_TO_ID[s.toUpperCase()])
    .filter(Boolean);

  if (!ids.length) return {};

  // Use /simple/price — lighter endpoint, less likely to rate limit
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

  let attempts = 0;
  while (attempts < 3) {
    const res = await fetch(url);

    if (res.status === 429) {
      attempts++;
      console.log(`CoinGecko rate limited — waiting 15s (attempt ${attempts}/3)...`);
      await sleep(15000);
      continue;
    }

    if (!res.ok) throw new Error(`CoinGecko error: ${res.statusText}`);

    const data = await res.json();
    const idToSymbol = Object.fromEntries(
      Object.entries(CRYPTO_SYMBOL_TO_ID).map(([k, v]) => [v, k])
    );

    const results: Record<string, any> = {};
    for (const [id, values] of Object.entries(data) as any) {
      const symbol = idToSymbol[id];
      if (symbol) {
        results[symbol] = {
          price_usd: values.usd,
          change_24h: values.usd_24h_change ?? null,
          market_cap: values.usd_market_cap ?? null,
          volume_24h: values.usd_24h_vol ?? null,
        };
      }
    }
    return results;
  }

  throw new Error("CoinGecko failed after 3 attempts — try again in a minute");
}

// --- Fetch stock price from Alpha Vantage (one at a time) ---
async function fetchStockPrice(symbol: string) {
  const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Alpha Vantage error: ${res.statusText}`);
  const data = await res.json();

  const quote = data["Global Quote"];
  if (!quote || !quote["05. price"]) {
    console.log(`No data for stock: ${symbol}`);
    return null;
  }

  const price = parseFloat(quote["05. price"]);
  const prevClose = parseFloat(quote["08. previous close"]);
  const change24h = prevClose ? ((price - prevClose) / prevClose) * 100 : null;

  return {
    price_usd: price,
    change_24h: change24h ? parseFloat(change24h.toFixed(4)) : null,
    market_cap: null,
    volume_24h: parseFloat(quote["06. volume"] ?? "0"),
  };
}

// --- Save price snapshot to Supabase ---
async function savePriceSnapshot(symbol: string, priceData: any) {
  const { error } = await supabase.from("price_history").insert({
    symbol,
    price_usd: priceData.price_usd,
    change_24h: priceData.change_24h,
    market_cap: priceData.market_cap,
    volume_24h: priceData.volume_24h,
    fetched_at: new Date().toISOString(),
  });

  if (error) console.error(`Failed to save ${symbol}: ${error.message}`);
}

// --- Main handler ---
Deno.serve(async (_req) => {
  try {
    console.log("Starting price fetch...");
    const { crypto, stocks } = await getWatchlist();

    // Crypto — one batch call
    const cryptoSymbols = crypto.map((a: any) => a.symbol);
    const cryptoPrices = await fetchCryptoPrices(cryptoSymbols);

    for (const asset of crypto) {
      const data = cryptoPrices[asset.symbol];
      if (data) {
        await savePriceSnapshot(asset.symbol, data);
        console.log(`✓ ${asset.symbol}: $${data.price_usd.toLocaleString()}`);
      } else {
        console.log(`✗ ${asset.symbol}: no data`);
      }
    }

    // Stocks — one call per symbol
    for (const asset of stocks) {
      console.log(`Fetching ${asset.symbol}...`);
      try {
        const data = await fetchStockPrice(asset.symbol);
        if (data) {
          await savePriceSnapshot(asset.symbol, data);
          console.log(`✓ ${asset.symbol}: $${data.price_usd.toLocaleString()}`);
        }
      } catch (e) {
        console.error(`✗ ${asset.symbol}: ${e}`);
      }
    }

    console.log("Price fetch complete.");
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});