import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALPHA_VANTAGE_KEY = Deno.env.get("ALPHA_VANTAGE_KEY")!;

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";
const FEAR_GREED_URL = "https://api.alternative.me/fng/";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Sleep helper ---
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Fetch active assets from Supabase ---
async function getAssets() {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("is_active", true);

  if (error) throw new Error(`Failed to fetch assets: ${error.message}`);

  const crypto = data.filter((a) => a.asset_type === "crypto");
  const stocks = data.filter((a) => a.asset_type === "stock");
  return { crypto, stocks };
}

// --- Fetch crypto prices from CoinGecko ---
async function fetchCryptoPrices(assets: any[]) {
  if (!assets.length) return {};

  const ids = assets.map((a) => a.coingecko_id).filter(Boolean);
  if (!ids.length) return {};

  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids.join(",")}&price_change_percentage=24h,7d&order=market_cap_desc`;

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

    // Map coingecko_id back to symbol
    const idToSymbol: Record<string, string> = {};
    for (const asset of assets) {
      if (asset.coingecko_id) idToSymbol[asset.coingecko_id] = asset.symbol;
    }

    const results: Record<string, any> = {};
    for (const coin of data) {
      const symbol = idToSymbol[coin.id];
      if (symbol) {
        results[symbol] = {
          price_usd: coin.current_price,
          change_24h: coin.price_change_percentage_24h ?? null,
          change_7d: coin.price_change_percentage_7d_in_currency ?? null,
          market_cap: coin.market_cap ?? null,
          volume_24h: coin.total_volume ?? null,
          circulating_supply: coin.circulating_supply ?? null,
        };
      }
    }
    return results;
  }

  throw new Error("CoinGecko failed after 3 attempts");
}

// --- Fetch stock price from Alpha Vantage ---
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
    change_7d: null,
    market_cap: null,
    volume_24h: parseFloat(quote["06. volume"] ?? "0"),
    circulating_supply: null,
  };
}

// --- Fetch Fear & Greed index ---
async function fetchFearGreed() {
  const res = await fetch(FEAR_GREED_URL);
  if (!res.ok) throw new Error(`Fear & Greed error: ${res.statusText}`);

  const data = await res.json();
  const latest = data.data?.[0];
  if (!latest) throw new Error("No Fear & Greed data returned");

  return {
    value: parseInt(latest.value),
    classification: latest.value_classification,
  };
}

// --- Save price snapshot ---
async function savePriceSnapshot(symbol: string, priceData: any) {
  const { error } = await supabase.from("price_snapshots").insert({
    symbol,
    price_usd: priceData.price_usd,
    change_24h: priceData.change_24h,
    change_7d: priceData.change_7d,
    market_cap: priceData.market_cap,
    volume_24h: priceData.volume_24h,
    circulating_supply: priceData.circulating_supply,
    fetched_at: new Date().toISOString(),
  });

  if (error) console.error(`Failed to save ${symbol}: ${error.message}`);
}

// --- Save Fear & Greed snapshot ---
async function saveFearGreed(data: { value: number; classification: string }) {
  const { error } = await supabase.from("fear_greed").insert({
    value: data.value,
    classification: data.classification,
    fetched_at: new Date().toISOString(),
  });

  if (error) console.error(`Failed to save fear & greed: ${error.message}`);
}

// --- Main handler ---
Deno.serve(async (_req) => {
  try {
    console.log("Starting market data fetch...");
    const { crypto, stocks } = await getAssets();

    // --- Crypto (batch) ---
    console.log(`Fetching ${crypto.length} crypto assets...`);
    const cryptoPrices = await fetchCryptoPrices(crypto);

    for (const asset of crypto) {
      const data = cryptoPrices[asset.symbol];
      if (data) {
        await savePriceSnapshot(asset.symbol, data);
        console.log(`✓ ${asset.symbol}: $${data.price_usd.toLocaleString()}`);
      } else {
        console.log(`✗ ${asset.symbol}: no data`);
      }
    }

    // --- Stocks (one at a time) ---
    console.log(`Fetching ${stocks.length} stock assets...`);
    for (const asset of stocks) {
      try {
        const data = await fetchStockPrice(asset.symbol);
        if (data) {
          await savePriceSnapshot(asset.symbol, data);
          console.log(`✓ ${asset.symbol}: $${data.price_usd.toLocaleString()}`);
        }
      } catch (e) {
        console.error(`✗ ${asset.symbol}: ${e}`);
      }
      // Small delay between Alpha Vantage calls (free tier: 5 calls/min)
      await sleep(12000);
    }

    // --- Fear & Greed ---
    console.log("Fetching Fear & Greed index...");
    try {
      const fearGreed = await fetchFearGreed();
      await saveFearGreed(fearGreed);
      console.log(`✓ Fear & Greed: ${fearGreed.value} (${fearGreed.classification})`);
    } catch (e) {
      console.error(`✗ Fear & Greed: ${e}`);
    }

    console.log("Market data fetch complete.");
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