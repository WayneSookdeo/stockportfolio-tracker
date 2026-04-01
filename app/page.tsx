import { supabase } from '@/lib/supabase'
import MarketStats from '@/components/MarketStats'
import FearGreed from '@/components/FearGreed'
import AssetTable from '@/components/AssetTable'
import TopMovers from '@/components/TopMovers'

async function getLatestPrices() {
  const { data, error } = await supabase
    .from('vw_latest_prices')
    .select('*')
    .order('market_cap', { ascending: false, nullsFirst: false })
  if (error) { console.error(error); return [] }
  return data
}

async function getMarketStats() {
  const { data, error } = await supabase
    .from('vw_market_stats')
    .select('*')
    .single()
  if (error) { console.error(error); return null }
  return data
}

async function getTopGainers() {
  const { data, error } = await supabase
    .from('vw_top_gainers')
    .select('*')
  if (error) { console.error(error); return [] }
  return data
}

async function getTopLosers() {
  const { data, error } = await supabase
    .from('vw_top_losers')
    .select('*')
  if (error) { console.error(error); return [] }
  return data
}

async function getFearGreed() {
  const { data, error } = await supabase
    .from('fear_greed')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single()
  if (error) { console.error(error); return null }
  return data
}

export const revalidate = 3600

export default async function Home() {
  const [prices, stats, gainers, losers, fearGreed] = await Promise.all([
    getLatestPrices(),
    getMarketStats(),
    getTopGainers(),
    getTopLosers(),
    getFearGreed(),
  ])

  const crypto = prices.filter((a: any) => a.asset_type === 'crypto')
  const stocks = prices.filter((a: any) => a.asset_type === 'stock')

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">📈 Market Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Crypto & stocks · Updated hourly
            </p>
          </div>
          <span className="text-xs text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Market stats + Fear & Greed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {stats && <MarketStats stats={stats} />}
          </div>
          <div>
            {fearGreed && <FearGreed data={fearGreed} />}
          </div>
        </div>

        {/* Top movers */}
        <TopMovers gainers={gainers} losers={losers} />

        {/* Crypto table */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Cryptocurrency
          </h2>
          <AssetTable assets={crypto} />
        </section>

        {/* Stocks */}
        {stocks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Stocks
            </h2>
            <AssetTable assets={stocks} />
          </section>
        )}

      </div>
    </main>
  )
}