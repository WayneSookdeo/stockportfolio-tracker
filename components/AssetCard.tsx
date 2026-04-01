type Asset = {
    symbol: string
    name: string
    asset_type: string
    quantity: number
    buy_price: number
    current_price: number
    change_24h: number
    unrealised_pnl: number
    current_value: number
    cost_basis: number
    fetched_at: string
  }
  
  export default function AssetCard({ asset }: { asset: Asset }) {
    const isPositive24h = asset.change_24h >= 0
    const isPnlPositive = asset.unrealised_pnl >= 0
  
    const formatUSD = (value: number) =>
      value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
  
    const formatPrice = (value: number) =>
      value >= 1
        ? formatUSD(value)
        : `$${value.toFixed(6)}`
  
    return (
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-600 transition-colors">
  
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-sm">
              {asset.symbol.slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold">{asset.symbol}</p>
              <p className="text-xs text-gray-500">{asset.name}</p>
            </div>
          </div>
  
          {/* 24h change badge */}
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive24h
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {isPositive24h ? '▲' : '▼'} {Math.abs(asset.change_24h).toFixed(2)}%
          </span>
        </div>
  
        {/* Current Price */}
        <p className="text-2xl font-bold mb-4">
          {formatPrice(asset.current_price)}
        </p>
  
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
  
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Holdings</p>
            <p className="font-medium">{asset.quantity} {asset.symbol}</p>
            <p className="text-xs text-gray-400">{formatUSD(asset.current_value)}</p>
          </div>
  
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Avg Buy Price</p>
            <p className="font-medium">{formatPrice(asset.buy_price)}</p>
            <p className="text-xs text-gray-400">Cost {formatUSD(asset.cost_basis)}</p>
          </div>
  
          <div className={`bg-gray-800 rounded-xl p-3 col-span-2`}>
            <p className="text-xs text-gray-500 mb-1">Unrealised P&L</p>
            <p className={`text-lg font-bold ${isPnlPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPnlPositive ? '+' : ''}{formatUSD(asset.unrealised_pnl)}
            </p>
          </div>
  
        </div>
  
        {/* Last updated */}
        <p className="text-xs text-gray-600 mt-3">
          Updated {new Date(asset.fetched_at).toLocaleString()}
        </p>
  
      </div>
    )
  }