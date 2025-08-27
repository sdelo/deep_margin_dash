import { useState, useMemo } from 'react'
import type { MarginLiquidation, MarginLoan } from '../types/data'

interface LiquidationsFeedProps {
  liquidations: MarginLiquidation[]
  loans: MarginLoan[]
}

interface FilterState {
  pool: string
  defaultRatioMin: number
  defaultRatioMax: number
  minAmount: number
  timeRange: '24h' | '7d' | '30d' | 'all'
}

export function LiquidationsFeed({ liquidations, loans }: LiquidationsFeedProps) {
  const [filters, setFilters] = useState<FilterState>({
    pool: 'all',
    defaultRatioMin: 0,
    defaultRatioMax: 100,
    minAmount: 0,
    timeRange: 'all'
  })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Get unique pools for filter dropdown
  const uniquePools = useMemo(() => {
    const pools = new Set(liquidations.map(liq => liq.margin_pool_id))
    return ['all', ...Array.from(pools).sort()]
  }, [liquidations])

  // Filter liquidations based on current filters
  const filteredLiquidations = useMemo(() => {
    const now = Date.now()
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }

    return liquidations
      .filter(liq => {
        // Time range filter
        if (filters.timeRange !== 'all') {
          const cutoff = now - timeRangeMs[filters.timeRange]
          if (liq.liquidated_at < cutoff) return false
        }

        // Pool filter
        if (filters.pool !== 'all' && liq.margin_pool_id !== filters.pool) {
          return false
        }

        // Default ratio filter
        const defaultRatio = (liq.default_amount / liq.liquidation_amount) * 100
        if (defaultRatio < filters.defaultRatioMin || defaultRatio > filters.defaultRatioMax) {
          return false
        }

        // Minimum amount filter
        if (liq.liquidation_amount < filters.minAmount) {
          return false
        }

        return true
      })
      .sort((a, b) => b.liquidated_at - a.liquidated_at)
  }, [liquidations, filters])

  // Get manager lifetime stats for expanded row
  const getManagerStats = (managerId: string) => {
    const managerLoans = loans.filter(loan => loan.margin_manager_id === managerId)
    const managerLiquidations = liquidations.filter(liq => liq.margin_manager_id === managerId)
    
    const totalBorrowed = managerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0)
    const totalRepaid = managerLoans
      .filter(loan => loan.status === 'repaid')
      .reduce((sum, loan) => sum + loan.loan_amount, 0)
    
    const borrowCount = managerLoans.length
    const repayCount = managerLoans.filter(loan => loan.status === 'repaid').length
    const liquidationCount = managerLiquidations.length
    const totalDefaults = managerLiquidations.reduce((sum, liq) => sum + liq.default_amount, 0)
    
    const repayRatio = totalBorrowed > 0 ? (totalRepaid / totalBorrowed) * 100 : 0

    return {
      totalBorrowed,
      totalRepaid,
      borrowCount,
      repayCount,
      liquidationCount,
      totalDefaults,
      repayRatio
    }
  }

  const toggleRowExpansion = (liquidationId: string) => {
    setExpandedRow(expandedRow === liquidationId ? null : liquidationId)
  }

  const resetFilters = () => {
    setFilters({
      pool: 'all',
      defaultRatioMin: 0,
      defaultRatioMax: 100,
      minAmount: 0,
      timeRange: 'all'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Liquidations Feed</h2>
          <p className="text-gray-600 mt-1">Severity & Economics Analysis</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredLiquidations.length} liquidations
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-2">Time Range</label>
            <select 
              value={filters.timeRange} 
              onChange={(e) => setFilters({...filters, timeRange: e.target.value as '24h' | '7d' | '30d' | 'all'})}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-fg mb-2">Pool</label>
            <select 
              value={filters.pool} 
              onChange={(e) => setFilters({...filters, pool: e.target.value})}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">All Pools</option>
              {Array.from(new Set(liquidations.map(l => l.margin_pool_id))).map(pool => (
                <option key={pool} value={pool}>{pool}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-fg mb-2">Default Ratio (%)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="0" 
                value={filters.defaultRatioMin} 
                onChange={(e) => setFilters(prev => ({ ...prev, defaultRatioMin: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-fg placeholder:text-fg/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <input 
                type="number" 
                placeholder="100" 
                value={filters.defaultRatioMax} 
                onChange={(e) => setFilters(prev => ({ ...prev, defaultRatioMax: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-fg placeholder:text-fg/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-fg mb-2">Min Amount ($)</label>
            <input 
              type="number" 
              placeholder="0" 
              value={filters.minAmount} 
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-fg placeholder:text-fg/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={resetFilters}
            className="px-4 py-2 bg-muted text-fg rounded-md hover:bg-muted/80 transition-colors border border-border"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Liquidations Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">TIME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">POOL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">MANAGER</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">LIQUIDATION AMOUNT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">DEFAULT AMOUNT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">RECOVERY RATE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">POOL REWARD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">LIQUIDATOR REWARD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">USER REWARD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredLiquidations.map((liquidation) => {
                const defaultRatio = (liquidation.default_amount / liquidation.liquidation_amount) * 100
                const recoveryRate = 100 - defaultRatio
                const isExpanded = expandedRow === liquidation.id

                return (
                  <>
                    <tr 
                      key={liquidation.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleRowExpansion(liquidation.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(liquidation.liquidated_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {liquidation.margin_pool_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {liquidation.margin_manager_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(liquidation.liquidation_amount / 1000).toFixed(1)}K
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(liquidation.default_amount / 1000).toFixed(1)}K
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          recoveryRate >= 95 ? 'bg-green-100 text-green-800' :
                          recoveryRate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {recoveryRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(liquidation.pool_reward_amount / 1000).toFixed(1)}K
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-xs">
                          <div>Base: ${(liquidation.liquidator_base_reward / 1000).toFixed(1)}K</div>
                          <div>Quote: ${(liquidation.liquidator_quote_reward / 1000).toFixed(1)}K</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(liquidation.pool_reward_amount / 1000).toFixed(1)}K
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900">
                          {isExpanded ? '−' : '+'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Event Payload */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Event Details</h4>
                              <div className="bg-white p-4 rounded border text-xs font-mono space-y-2">
                                <div><span className="text-gray-500">ID:</span> {liquidation.id}</div>
                                <div><span className="text-gray-500">Manager:</span> {liquidation.margin_manager_id}</div>
                                <div><span className="text-gray-500">Pool:</span> {liquidation.margin_pool_id}</div>
                                <div><span className="text-gray-500">Liquidation Amount:</span> {liquidation.liquidation_amount}</div>
                                <div><span className="text-gray-500">Default Amount:</span> {liquidation.default_amount}</div>
                                <div><span className="text-gray-500">Pool Reward:</span> {liquidation.pool_reward_amount}</div>
                                <div><span className="text-gray-500">Liquidator Base:</span> {liquidation.liquidator_base_reward}</div>
                                <div><span className="text-gray-500">Liquidator Quote:</span> {liquidation.liquidator_quote_reward}</div>
                                <div><span className="text-gray-500">Pool Reward:</span> {liquidation.pool_reward_amount}</div>
                                <div><span className="text-gray-500">Timestamp:</span> {liquidation.liquidated_at}</div>
                              </div>
                            </div>

                            {/* Manager Lifetime Stats */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Manager Lifetime Stats</h4>
                              {(() => {
                                const stats = getManagerStats(liquidation.margin_manager_id)
                                return (
                                  <div className="bg-white p-4 rounded border">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <div className="text-gray-500">Total Borrowed</div>
                                        <div className="font-semibold">${(stats.totalBorrowed / 1000).toFixed(1)}K</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Total Repaid</div>
                                        <div className="font-semibold">${(stats.totalRepaid / 1000).toFixed(1)}K</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Borrow Count</div>
                                        <div className="font-semibold">{stats.borrowCount}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Repay Count</div>
                                        <div className="font-semibold">{stats.repayCount}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Liquidations</div>
                                        <div className="font-semibold">{stats.liquidationCount}</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-500">Total Defaults</div>
                                        <div className="font-semibold">${(stats.totalDefaults / 1000).toFixed(1)}K</div>
                                      </div>
                                      <div className="col-span-2">
                                        <div className="text-gray-500">Repay Ratio</div>
                                        <div className={`font-semibold ${
                                          stats.repayRatio >= 80 ? 'text-green-600' :
                                          stats.repayRatio >= 50 ? 'text-yellow-600' :
                                          'text-red-600'
                                        }`}>
                                          {stats.repayRatio.toFixed(1)}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>

          {filteredLiquidations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No liquidations found</div>
              <div className="text-gray-400 text-sm mt-2">Try adjusting your filters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
