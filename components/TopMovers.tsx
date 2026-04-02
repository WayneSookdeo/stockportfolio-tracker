type Asset = {
  symbol: string
  name: string
  price_usd: number
  change_24h: number
  asset_type: string
}

function MoverCard({ asset }: { asset: Asset }) {
  const isPositive = asset.change_24h >= 0

  const formatPrice = (value: number) =>
    value >= 1
      ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : `$${value.toFixed(6)}`

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
          ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {asset.symbol.slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-sm">{asset.symbol}</p>
          <p className="text-xs text-gray-500">{asset.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{formatPrice(asset.price_usd)}</p>
        <p className={`text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(asset.change_24h).toFixed(2)}%
        </p>
      </div>
    </div>
  )
}

export default function TopMovers({
  gainers,
  losers,
}: {
  gainers: Asset[]
  losers: Asset[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Best Performers */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-400 text-lg">↕</span>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Best Performers (24h)
          </h2>
        </div>
        <div className="space-y-2">
          {gainers.length > 0 ? (
            gainers.map((asset) => (
              <MoverCard key={asset.symbol} asset={asset} />
            ))
          ) : (
            <p className="text-gray-600 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Worst Performers */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-400 text-lg">↕</span>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Worst Performers (24h)
          </h2>
        </div>
        <div className="space-y-2">
          {losers.length > 0 ? (
            losers.map((asset) => (
              <MoverCard key={asset.symbol} asset={asset} />
            ))
          ) : (
            <p className="text-gray-600 text-sm">No data yet</p>
          )}
        </div>
      </div>

    </div>
  )
}