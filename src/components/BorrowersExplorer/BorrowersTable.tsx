import React from 'react'
import { formatUSD } from '../../utils/deepbookUtils'
import type { BorrowerData } from './types'

interface BorrowersTableProps {
  borrowers: BorrowerData[]
  expandedBorrower: string | null
  showDeepBookMetrics: boolean
  sortField: keyof BorrowerData
  sortDirection: 'asc' | 'desc'
  onSort: (field: keyof BorrowerData) => void
  onToggleExpansion: (managerId: string) => void
}

export function BorrowersTable({ 
  borrowers, 
  expandedBorrower, 
  showDeepBookMetrics, 
  sortField, 
  sortDirection, 
  onSort, 
  onToggleExpansion 
}: BorrowersTableProps) {
  
  // Helper functions for enhanced metrics
  const calculateBorrowUsed = (borrower: BorrowerData): { percentage: number; color: string; label: string } => {
    if (!borrower.deepbookPosition) {
      // Fallback calculation using existing data
      const totalAssets = borrower.totalOutstandingDebt + (borrower.defaultSum || 0)
      const borrowUsed = totalAssets > 0 ? (borrower.totalOutstandingDebt / totalAssets) * 100 : 0
      
      if (borrowUsed < 60) return { percentage: borrowUsed, color: 'text-green-600', label: 'Low Risk' }
      if (borrowUsed < 85) return { percentage: borrowUsed, color: 'text-amber-600', label: 'Medium Risk' }
      return { percentage: borrowUsed, color: 'text-red-600', label: 'High Risk' }
    }

    const borrowUsed = borrower.deepbookPosition.borrow_usage
    if (borrowUsed < 60) return { percentage: borrowUsed, color: 'text-green-600', label: 'Low Risk' }
    if (borrowUsed < 85) return { percentage: borrowUsed, color: 'text-amber-600', label: 'Medium Risk' }
    return { percentage: borrowUsed, color: 'text-red-600', label: 'High Risk' }
  }

  const calculateHealthFactor = (borrower: BorrowerData): { value: string; tooltip?: string } => {
    if (borrower.deepbookPosition) {
      return { value: `${borrower.deepbookPosition.health_factor.toFixed(2)}x` }
    }

    // Fallback calculation: HF = Borrow Limit / Borrow Value
    const totalAssets = borrower.totalOutstandingDebt + (borrower.defaultSum || 0)
    if (totalAssets === 0) {
      return { value: '—', tooltip: 'No position data available' }
    }

    const healthFactor = totalAssets / Math.max(borrower.totalOutstandingDebt, 1)
    return { value: `${healthFactor.toFixed(2)}x`, tooltip: 'Calculated from available data' }
  }

  const calculateLiquidationBuffer = (borrower: BorrowerData): { value: string; color: string } => {
    if (!borrower.deepbookPosition) {
      return { value: '—', color: 'text-gray-400' }
    }

    const buffer = borrower.deepbookPosition.distance_to_liquidation
    if (buffer <= 5) return { value: `-${buffer.toFixed(1)}% to liq`, color: 'text-red-600' }
    if (buffer <= 15) return { value: `-${buffer.toFixed(1)}% to liq`, color: 'text-amber-600' }
    return { value: `-${buffer.toFixed(1)}% to liq`, color: 'text-green-600' }
  }

  const calculateInterest24h = (borrower: BorrowerData): string => {
    if (!borrower.deepbookPosition) return '—'
    return formatUSD(String(Math.round(borrower.deepbookPosition.daily_interest_cost_usd * 1000000000)))
  }

  const SortableHeader = ({ field, children }: { field: keyof BorrowerData; children: React.ReactNode }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider cursor-pointer hover:bg-muted/50"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-blue-500">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )

  if (borrowers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No borrowers found</div>
        <div className="text-gray-400 text-sm mt-2">Try adjusting your search</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">BORROWER</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">POOL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">LOAN AMOUNT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">BORROW USED %</th>
              {showDeepBookMetrics && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">HEALTH FACTOR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">NET EQUITY</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">INTEREST (24H)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">LIQ BUFFER</th>
                </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {borrowers.map((borrower) => {
              const isExpanded = expandedBorrower === borrower.managerId
              const daysSinceFirstSeen = (Date.now() - borrower.firstSeen) / (1000 * 60 * 60 * 24)
              const daysSinceLastActivity = (Date.now() - borrower.lastActivity) / (1000 * 60 * 60 * 24)

              // Calculate enhanced metrics
              const borrowUsed = calculateBorrowUsed(borrower)
              const healthFactor = calculateHealthFactor(borrower)
              const liquidationBuffer = calculateLiquidationBuffer(borrower)
              const interest24h = calculateInterest24h(borrower)

              return (
                <React.Fragment key={borrower.managerId}>
                  <tr 
                    className={`hover:bg-muted/50 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                    onClick={() => onToggleExpansion(borrower.managerId)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fg font-medium">{borrower.owner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">
                          {borrower.poolsUsed.join(', ')}
                        </span>
                        {borrower.poolsUsed.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Liq: {borrower.poolsUsed.map(pool => {
                              // TODO: Get actual pool risk thresholds from deepbookPools
                              return '1.2x'
                            }).join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fg font-semibold">${(borrower.totalOutstandingDebt / 1000).toFixed(1)}K</td>
                    {/* Borrow Used % - Replaces Status */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                      <div className="flex flex-col">
                        <span className={`font-semibold ${borrowUsed.color}`}>
                          {borrowUsed.percentage.toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500">{borrowUsed.label}</span>
                      </div>
                    </td>
                    
                    {/* DeepBook v3 Metrics */}
                    {showDeepBookMetrics && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                          <div className="flex items-center space-x-1">
                            <span className="font-semibold">{healthFactor.value}</span>
                            {healthFactor.tooltip && (
                              <div className="group relative">
                                <span className="text-gray-400 cursor-help">ⓘ</span>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {healthFactor.tooltip}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                          {borrower.deepbookPosition ? (
                            <span className={`font-semibold ${
                              borrower.deepbookPosition.net_equity_usd >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatUSD(String(Math.round(borrower.deepbookPosition.net_equity_usd * 1000000000)))}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                          <div className="flex flex-col">
                            <span className="font-medium">{interest24h}</span>
                            <span className="text-xs text-gray-500">est.</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            liquidationBuffer.color === 'text-red-600' ? 'bg-red-100 text-red-800' :
                            liquidationBuffer.color === 'text-amber-600' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {liquidationBuffer.value}
                          </span>
                        </td>
                      </>
                    )}
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fg/90">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleExpansion(borrower.managerId)
                        }}
                        className="text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'Show'} Details
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={showDeepBookMetrics ? 9 : 5} className="px-6 py-4 bg-muted/30">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-fg mb-2">Event Timeline</h4>
                            <div className="space-y-2">
                              <div className="text-sm text-fg/90">
                                <span className="font-medium">First seen:</span> {new Date(borrower.firstSeen).toLocaleDateString()} ({daysSinceFirstSeen.toFixed(0)} days ago)
                              </div>
                              <div className="text-sm text-fg/90">
                                <span className="font-medium">Last activity:</span> {new Date(borrower.lastActivity).toLocaleDateString()} ({daysSinceLastActivity.toFixed(0)} days ago)
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-fg mb-2">Duration Analysis</h4>
                            <div className="text-sm text-fg/90">
                              <span className="font-medium">Active for:</span> {daysSinceFirstSeen.toFixed(0)} days
                            </div>
                          </div>

                          {/* DeepBook v3 Enhanced Details */}
                          {showDeepBookMetrics && borrower.deepbookPosition && (
                            <div>
                              <h4 className="text-sm font-semibold text-fg mb-2">DeepBook v3 Position Details</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-blue-600">Base Assets:</span> {formatUSD(String(Math.round(borrower.deepbookPosition.base_asset_usd * 1000000000)))}
                                </div>
                                <div>
                                  <span className="font-medium text-blue-600">Quote Assets:</span> {formatUSD(String(Math.round(borrower.deepbookPosition.quote_asset_usd * 1000000000)))}
                                </div>
                                <div>
                                  <span className="font-medium text-red-600">Base Debt:</span> {formatUSD(String(Math.round(borrower.deepbookPosition.base_debt_usd * 1000000000)))}
                                </div>
                                <div>
                                  <span className="font-medium text-red-600">Quote Debt:</span> {formatUSD(String(Math.round(borrower.deepbookPosition.quote_debt_usd * 1000000000)))}
                                </div>
                                <div>
                                  <span className="font-medium text-green-600">Liquidation Threshold:</span> {borrower.deepbookPosition.liquidation_threshold.toFixed(2)}x
                                </div>
                                <div>
                                  <span className="font-medium text-orange-600">Distance to Liquidation:</span> {borrower.deepbookPosition.distance_to_liquidation.toFixed(1)}%
                                </div>
                                <div>
                                  <span className="font-medium text-purple-600">Daily Interest Cost:</span> {formatUSD(String(Math.round(borrower.deepbookPosition.daily_interest_cost_usd * 1000000000)))}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Last Updated:</span> {new Date(borrower.deepbookPosition.last_updated).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Enhanced Risk Metrics */}
                          {showDeepBookMetrics && (
                            <div>
                              <h4 className="text-sm font-semibold text-fg mb-2">Risk Analysis</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-blue-600">Borrow Used:</span> 
                                  <span className={`ml-2 ${borrowUsed.color}`}>
                                    {borrowUsed.percentage.toFixed(1)}% ({borrowUsed.label})
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-green-600">Health Factor:</span> 
                                  <span className="ml-2">{healthFactor.value}</span>
                                  {healthFactor.tooltip && (
                                    <span className="ml-1 text-gray-400">ⓘ</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium text-orange-600">Liquidation Buffer:</span> 
                                  <span className={`ml-2 ${liquidationBuffer.color}`}>
                                    {liquidationBuffer.value}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-purple-600">24h Interest Cost:</span> 
                                  <span className="ml-2">{interest24h}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
