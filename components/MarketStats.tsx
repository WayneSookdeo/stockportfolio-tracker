type Stats = {
    total_assets: number
    total_market_cap: number
    total_volume_24h: number
    btc_dominance: number
  }
  
  function formatLargeNumber(value: number) {
    if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    return `$${value.toLocaleString()}`
  }
  
  export default function MarketStats({ stats }: { stats: Stats }) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 h-full">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
          Global Market Overview
        </h2>
  
        <div className="grid grid-cols-3 gap-6">
  
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Market Cap</p>
            <p className="text-2xl font-bold">
              {formatLargeNumber(stats.total_market_cap)}
            </p>
          </div>
  
          <div>
            <p className="text-xs text-gray-500 mb-1">24h Volume</p>
            <p className="text-2xl font-bold text-gray-200">
              {formatLargeNumber(stats.total_volume_24h)}
            </p>
          </div>
  
          <div>
            <p className="text-xs text-gray-500 mb-1">BTC Dominance</p>
            <p className="text-2xl font-bold text-orange-400">
              {Number(stats.btc_dominance).toFixed(1)}%
            </p>
          </div>
  
        </div>
  
        {/* BTC dominance bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>BTC</span>
            <span>Other</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-orange-400"
              style={{ width: `${stats.btc_dominance}%` }}
            />
          </div>
        </div>
  
      </div>
    )
  }