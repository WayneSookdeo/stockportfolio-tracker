type Summary = {
    total_assets: number
    total_value_usd: number
    total_cost_basis: number
    total_pnl: number
    total_pnl_percentage: number
  }
  
  export default function PortfolioSummary({ summary }: { summary: Summary }) {
    const isPositive = summary.total_pnl >= 0
  
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4">
          Portfolio Overview
        </h2>
  
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
  
          {/* Total Value */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Value</p>
            <p className="text-2xl font-bold">
              ${Number(summary.total_value_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
  
          {/* Cost Basis */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Amount Invested</p>
            <p className="text-2xl font-bold text-gray-300">
              ${Number(summary.total_cost_basis).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
  
          {/* P&L */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Unrealised P&L</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}${Number(summary.total_pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
  
          {/* P&L % */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Return</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{Number(summary.total_pnl_percentage).toFixed(2)}%
            </p>
          </div>
  
        </div>
  
        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Cost basis</span>
            <span>Current value</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
              style={{
                width: `${Math.min(
                  (summary.total_value_usd / Math.max(summary.total_value_usd, summary.total_cost_basis)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    )
  }