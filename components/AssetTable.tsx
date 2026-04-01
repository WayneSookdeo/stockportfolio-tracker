type Asset = {
    symbol: string
    name: string
    asset_type: string
    price_usd: number
    change_24h: number | null
    change_7d: number | null
    market_cap: number | null
    volume_24h: number | null
    fetched_at: string
  }
  
  function formatPrice(value: number) {
    if (value >= 1)
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    return `$${value.toFixed(6)}`
  }
  
  function formatLargeNumber(value: number | null) {
    if (!value) return '—'
    if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    return `$${value.toLocaleString()}`
  }
  
  function ChangeCell({ value }: { value: number | null }) {
    if (value === null) return <span className="text-gray-600">—</span>
    const isPositive = value >= 0
    return (
      <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
      </span>
    )
  }
  
  export default function AssetTable({ assets }: { assets: Asset[] }) {
    if (!assets.length) {
      return (
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center text-gray-600 text-sm">
          No data yet — run the Edge Function to populate prices.
        </div>
      )
    }
  
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Asset</th>
                <th className="text-right px-5 py-3">Price</th>
                <th className="text-right px-5 py-3">24h</th>
                <th className="text-right px-5 py-3">7d</th>
                <th className="text-right px-5 py-3 hidden md:table-cell">Market Cap</th>
                <th className="text-right px-5 py-3 hidden md:table-cell">Volume (24h)</th>
                <th className="text-right px-5 py-3 hidden lg:table-cell">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr
                  key={asset.symbol}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors
                    ${index === assets.length - 1 ? 'border-b-0' : ''}`}
                >
                  {/* Asset */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300">
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{asset.symbol}</p>
                        <p className="text-xs text-gray-500">{asset.name}</p>
                      </div>
                    </div>
                  </td>
  
                  {/* Price */}
                  <td className="px-5 py-4 text-right font-mono font-medium">
                    {formatPrice(asset.price_usd)}
                  </td>
  
                  {/* 24h change */}
                  <td className="px-5 py-4 text-right">
                    <ChangeCell value={asset.change_24h} />
                  </td>
  
                  {/* 7d change */}
                  <td className="px-5 py-4 text-right">
                    <ChangeCell value={asset.change_7d} />
                  </td>
  
                  {/* Market cap */}
                  <td className="px-5 py-4 text-right text-gray-400 hidden md:table-cell">
                    {formatLargeNumber(asset.market_cap)}
                  </td>
  
                  {/* Volume */}
                  <td className="px-5 py-4 text-right text-gray-400 hidden md:table-cell">
                    {formatLargeNumber(asset.volume_24h)}
                  </td>
  
                  {/* Last updated */}
                  <td className="px-5 py-4 text-right text-gray-600 text-xs hidden lg:table-cell">
                    {new Date(asset.fetched_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }