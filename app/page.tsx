import { supabase } from '@/lib/supabase'
import PortfolioSummary from '@/components/PortfolioSummary'
import AssetCard from '@/components/AssetCard'

async function getLatestPrices() {
  const { data, error } = await supabase
    .from('vw_latest_prices')
    .select('*')

  if (error) {
    console.error('Error fetching prices:', error)
    return []
  }
  return data
}

async function getPortfolioSummary() {
  const { data, error } = await supabase
    .from('vw_portfolio_summary')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching summary:', error)
    return null
  }
  return data
}

export default async function Home() {
  const [prices, summary] = await Promise.all([
    getLatestPrices(),
    getPortfolioSummary(),
  ])

  const crypto = prices.filter((a) => a.asset_type === 'crypto')
  const stocks = prices.filter((a) => a.asset_type === 'stock')

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Tracker</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Live prices · Updated daily · Powered by CoinGecko & Alpha Vantage
          </p>
        </div>

        {/* Portfolio Summary */}
        {summary && <PortfolioSummary summary={summary} />}

        {/* Crypto */}
        {crypto.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Crypto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {crypto.map((asset) => (
                <AssetCard key={asset.symbol} asset={asset} />
              ))}
            </div>
          </section>
        )}

        {/* Stocks */}
        {stocks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Stocks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stocks.map((asset) => (
                <AssetCard key={asset.symbol} asset={asset} />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}