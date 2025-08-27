import { useMemo } from 'react'
import { BarChart, Bar, ResponsiveContainer, LineChart, Line } from 'recharts'
import type { MarginLoan, MarginLiquidation } from '../services/api'

interface PoolsTableProps {
  loans: MarginLoan[]
  liquidations: MarginLiquidation[]
}

export function PoolsTable({ loans, liquidations }: PoolsTableProps) {
  const poolData = useMemo(() => {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    // Get unique pools
    const pools = new Set([
      ...loans.map(l => l.margin_pool_id),
      ...liquidations.map(l => l.margin_pool_id)
    ])

    return Array.from(pools).map(pool => {
      // Filter data for this pool
      const poolLoans = loans.filter(l => l.margin_pool_id === pool)
      const poolLiquidations = liquidations.filter(l => l.margin_pool_id === pool)

      // Outstanding debt = Total borrowed - Total repaid - Liquidation repaid
      const totalBorrowed = poolLoans.reduce((sum, l) => sum + l.loan_amount, 0)
      const totalRepaid = poolLoans
        .filter(l => l.repaid_at)
        .reduce((sum, l) => sum + l.loan_amount, 0)
      const liquidationRepaid = poolLiquidations
        .reduce((sum, l) => sum + (l.liquidation_amount - l.default_amount), 0)
      const outstandingDebt = totalBorrowed - totalRepaid - liquidationRepaid

      // 24h metrics
      const borrowed24h = poolLoans
        .filter(l => l.borrowed_at >= oneDayAgo)
        .reduce((sum, l) => sum + l.loan_amount, 0)
      const repaid24h = poolLoans
        .filter(l => l.repaid_at && l.repaid_at >= oneDayAgo)
        .reduce((sum, l) => sum + l.loan_amount, 0)
      const net24h = borrowed24h - repaid24h

      // 7d metrics
      const liquidations7d = poolLiquidations
        .filter(l => l.liquidated_at >= sevenDaysAgo)
        .length
      const totalLiquidationAmount = poolLiquidations
        .filter(l => l.liquidated_at >= sevenDaysAgo)
        .reduce((sum, l) => sum + l.liquidation_amount, 0)
      const totalDefaults = poolLiquidations
        .filter(l => l.liquidated_at >= sevenDaysAgo)
        .reduce((sum, l) => sum + l.default_amount, 0)
      const defaultRate = totalLiquidationAmount > 0 ? (totalDefaults / totalLiquidationAmount) * 100 : 0
      const poolRewards7d = poolLiquidations
        .filter(l => l.liquidated_at >= sevenDaysAgo)
        .reduce((sum, l) => sum + l.pool_reward_amount, 0)

      // Generate sparkline data (7 days of net debt change)
      const sparklineData: { value: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000
        const dayEnd = now - i * 24 * 60 * 60 * 1000
        const dayBorrowed = poolLoans
          .filter(l => l.borrowed_at >= dayStart && l.borrowed_at < dayEnd)
          .reduce((sum, l) => sum + l.loan_amount, 0)
        const dayRepaid = poolLoans
          .filter(l => l.repaid_at && l.repaid_at >= dayStart && l.repaid_at < dayEnd)
          .reduce((sum, l) => sum + l.loan_amount, 0)
        sparklineData.push({ value: dayBorrowed - dayRepaid })
      }

      // Generate liquidation bar data (7 days)
      const liquidationData: { value: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000
        const dayEnd = now - i * 24 * 60 * 60 * 1000
        const dayLiquidations = poolLiquidations
          .filter(l => l.liquidated_at >= dayStart && l.liquidated_at < dayEnd)
          .length
        liquidationData.push({ value: dayLiquidations })
      }

      return {
        pool,
        outstandingDebt,
        borrowed24h,
        repaid24h,
        net24h,
        liquidations7d,
        defaultRate,
        poolRewards7d,
        sparklineData,
        liquidationData,
      }
    }).sort((a, b) => b.outstandingDebt - a.outstandingDebt) // Sort by outstanding debt desc
  }, [loans, liquidations])

  const formatCurrency = (amount: number): string => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
    return `$${amount.toFixed(0)}`
  }

  const formatPercentage = (value: number): string => `${value.toFixed(1)}%`

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Pools & Debt Leaderboard</h2>
          <p className="text-sm text-gray-600 mt-1">Which markets are hot, risky, and profitable</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pool
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outstanding Debt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Borrowed (24h)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Repaid (24h)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net (24h)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Debt Trend (7d)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Liquidations (7d)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Liquidation Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pool Rewards (7d)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {poolData.map((pool) => (
              <tr key={pool.pool} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-blue-600">
                      {pool.pool}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(pool.outstandingDebt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(pool.borrowed24h)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(pool.repaid24h)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    pool.net24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pool.net24h >= 0 ? '+' : ''}{formatCurrency(pool.net24h)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-16 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pool.sparklineData}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {pool.liquidations7d}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-16 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pool.liquidationData}>
                        <Bar dataKey="value" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    pool.defaultRate > 5 ? 'text-red-600' : 
                    pool.defaultRate > 2 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {formatPercentage(pool.defaultRate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(pool.poolRewards7d)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {poolData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No pool data available</p>
        </div>
      )}
    </div>
  )
}
