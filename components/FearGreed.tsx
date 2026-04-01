'use client'

type FearGreedData = {
  value: number
  classification: string
  fetched_at: string
}

function getColor(value: number) {
  if (value <= 20) return { text: 'text-red-500', bg: 'bg-red-500', ring: 'ring-red-500/20' }
  if (value <= 40) return { text: 'text-orange-400', bg: 'bg-orange-400', ring: 'ring-orange-400/20' }
  if (value <= 60) return { text: 'text-yellow-400', bg: 'bg-yellow-400', ring: 'ring-yellow-400/20' }
  if (value <= 80) return { text: 'text-green-400', bg: 'bg-green-400', ring: 'ring-green-400/20' }
  return { text: 'text-emerald-400', bg: 'bg-emerald-400', ring: 'ring-emerald-400/20' }
}

export default function FearGreed({ data }: { data: FearGreedData }) {
  const colors = getColor(data.value)
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (data.value / 100) * circumference

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 h-full flex flex-col">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
        Fear & Greed Index
      </h2>

      <div className="flex-1 flex flex-col items-center justify-center gap-3">

        {/* Circular gauge */}
        <div className={`relative ring-8 ${colors.ring} rounded-full`}>
          <svg width="100" height="100" className="-rotate-90">
            {/* Background circle */}
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="#1f2937"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={colors.text}
            />
          </svg>
          {/* Value in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${colors.text}`}>
              {data.value}
            </span>
          </div>
        </div>

        {/* Classification */}
        <p className={`text-lg font-bold ${colors.text}`}>
          {data.classification}
        </p>

        {/* Scale labels */}
        <div className="flex justify-between w-full text-xs text-gray-600 mt-1">
          <span>Extreme Fear</span>
          <span>Neutral</span>
          <span>Extreme Greed</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${colors.bg} transition-all`}
            style={{ width: `${data.value}%` }}
          />
        </div>

        <p className="text-xs text-gray-600">
          Updated {new Date(data.fetched_at).toLocaleDateString()}
        </p>

      </div>
    </div>
  )
}