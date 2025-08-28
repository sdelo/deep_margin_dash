import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { MarginManager, MarginLoan, MarginLiquidation } from '../services/api'
import { useDeepBookData } from '../hooks/useDeepBookData'
import { formatUSD, formatPercentage, getHealthStatusColor } from '../utils/deepbookUtils'
import type { PositionSummary } from '../types/deepbook'

interface BorrowersExplorerProps {
  managers: MarginManager[]
  loans: MarginLoan[]
  liquidations: MarginLiquidation[]
}

interface BorrowerData {
  managerId: string
  owner: string
  firstSeen: number
  lastActivity: number
  poolsUsed: string[]
  outstandingDebtByPool: Record<string, number>
  totalOutstandingDebt: number
  borrowCount: number
  repayCount: number
  liquidationCount: number
  defaultSum: number
  repayRatio: number
  // DeepBook v3 enhanced metrics
  deepbookPosition?: PositionSummary
  events: Array<{
    type: 'created' | 'borrow' | 'repay' | 'liquidation'
    timestamp: number
    pool?: string
    amount?: number
    details: any
  }>
}

interface LoanBucket {
  amount: number
  timestamp: number
  pool: string
}

export function BorrowersExplorer({ managers, loans, liquidations }: BorrowersExplorerProps) {
  const [expandedBorrower, setExpandedBorrower] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof BorrowerData>('totalOutstandingDebt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeepBookMetrics, setShowDeepBookMetrics] = useState(true)

  // Get DeepBook v3 data
  const { 
    positionSummaries, 
    dashboardMetrics, 
    loading: deepbookLoading, 
    error: deepbookError 
  } = useDeepBookData()

  // Calculate borrower data with event-sourced positions
  const borrowersData = useMemo(() => {
    const borrowerMap = new Map<string, BorrowerData>()

    // Initialize from managers
    managers.forEach(manager => {
      borrowerMap.set(manager.id, {
        managerId: manager.id,
        owner: manager.owner,
        firstSeen: manager.created_at,
        lastActivity: manager.created_at,
        poolsUsed: [],
        outstandingDebtByPool: {},
        totalOutstandingDebt: 0,
        borrowCount: 0,
        repayCount: 0,
        liquidationCount: 0,
        defaultSum: 0,
        repayRatio: 0,
        events: [{
          type: 'created',
          timestamp: manager.created_at,
          details: manager
        }]
      })
    })

    // Process loans
    loans.forEach(loan => {
      const borrower = borrowerMap.get(loan.margin_manager_id)
      if (!borrower) return

      // Update activity tracking
      borrower.lastActivity = Math.max(borrower.lastActivity, loan.borrowed_at)
      if (loan.status === 'repaid' && loan.repaid_at) {
        borrower.lastActivity = Math.max(borrower.lastActivity, loan.repaid_at)
      }

      // Track pools used
      if (!borrower.poolsUsed.includes(loan.margin_pool_id)) {
        borrower.poolsUsed.push(loan.margin_pool_id)
      }

      // Initialize pool debt tracking
      if (!borrower.outstandingDebtByPool[loan.margin_pool_id]) {
        borrower.outstandingDebtByPool[loan.margin_pool_id] = 0
      }

      // Add to outstanding debt
      borrower.outstandingDebtByPool[loan.margin_pool_id] += loan.loan_amount
      borrower.borrowCount++

      // Add borrow event
      borrower.events.push({
        type: 'borrow',
        timestamp: loan.borrowed_at,
        pool: loan.margin_pool_id,
        amount: loan.loan_amount,
        details: loan
      })

      // Process repayments
      if (loan.status === 'repaid' && loan.repaid_at) {
        borrower.outstandingDebtByPool[loan.margin_pool_id] -= loan.loan_amount
        borrower.repayCount++

        borrower.events.push({
          type: 'repay',
          timestamp: loan.repaid_at,
          pool: loan.margin_pool_id,
          amount: loan.loan_amount,
          details: loan
        })
      }
    })

    // Process liquidations
    liquidations.forEach(liquidation => {
      const borrower = borrowerMap.get(liquidation.margin_manager_id)
      if (!borrower) return

      borrower.lastActivity = Math.max(borrower.lastActivity, liquidation.liquidated_at)
      borrower.liquidationCount++
      borrower.defaultSum += liquidation.default_amount

      // Reduce outstanding debt by liquidation amount minus default
      const liquidationRepaid = liquidation.liquidation_amount - liquidation.default_amount
      if (borrower.outstandingDebtByPool[liquidation.margin_pool_id]) {
        borrower.outstandingDebtByPool[liquidation.margin_pool_id] -= liquidationRepaid
      }

      borrower.events.push({
        type: 'liquidation',
        timestamp: liquidation.liquidated_at,
        pool: liquidation.margin_pool_id,
        amount: liquidation.liquidation_amount,
        details: liquidation
      })
    })

    // Enhance with DeepBook v3 data
    if (positionSummaries.length > 0) {
      positionSummaries.forEach(position => {
        const borrower = borrowerMap.get(position.manager_id)
        if (borrower) {
          borrower.deepbookPosition = position
        }
      })
    }

    // Calculate final metrics for each borrower
    borrowerMap.forEach(borrower => {
      // Calculate total outstanding debt
      borrower.totalOutstandingDebt = Object.values(borrower.outstandingDebtByPool)
        .reduce((sum, debt) => sum + Math.max(0, debt), 0)

      // Calculate repay ratio
      const totalBorrowed = loans
        .filter(loan => loan.margin_manager_id === borrower.managerId)
        .reduce((sum, loan) => sum + loan.loan_amount, 0)
      
      const totalRepaid = loans
        .filter(loan => loan.margin_manager_id === borrower.managerId && loan.status === 'repaid')
        .reduce((sum, loan) => sum + loan.loan_amount, 0)

      borrower.repayRatio = totalBorrowed > 0 ? (totalRepaid / totalBorrowed) * 100 : 0

      // Sort events by timestamp
      borrower.events.sort((a, b) => a.timestamp - b.timestamp)
    })

    return Array.from(borrowerMap.values())
  }, [managers, loans, liquidations, positionSummaries])

  // Filter and sort borrowers
  const filteredAndSortedBorrowers = useMemo(() => {
    let filtered = borrowersData

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(borrower => 
        borrower.owner.toLowerCase().includes(search) ||
        borrower.managerId.toLowerCase().includes(search) ||
        borrower.poolsUsed.some(pool => pool.toLowerCase().includes(search))
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      
      let comparison = 0
      if (Array.isArray(aVal) && Array.isArray(bVal)) {
        comparison = aVal.length - bVal.length
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      return sortDirection === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [borrowersData, searchTerm, sortField, sortDirection])

  const handleSort = (field: keyof BorrowerData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleBorrowerExpansion = (managerId: string) => {
    setExpandedBorrower(expandedBorrower === managerId ? null : managerId)
  }

  // Calculate loan duration estimates using FIFO buckets
  const calculateLoanDurations = (borrower: BorrowerData) => {
    const bucketsByPool: Record<string, LoanBucket[]> = {}
    const durations: Array<{ pool: string; duration: number; amount: number }> = []

    borrower.events.forEach(event => {
      if (!event.pool) return

      if (!bucketsByPool[event.pool]) {
        bucketsByPool[event.pool] = []
      }

      if (event.type === 'borrow' && event.amount) {
        // Add to bucket
        bucketsByPool[event.pool].push({
          amount: event.amount,
          timestamp: event.timestamp,
          pool: event.pool
        })
      } else if ((event.type === 'repay' || event.type === 'liquidation') && event.amount) {
        // Remove from bucket FIFO
        let remainingAmount = event.amount
        
        while (remainingAmount > 0 && bucketsByPool[event.pool].length > 0) {
          const bucket = bucketsByPool[event.pool][0]
          const takenAmount = Math.min(remainingAmount, bucket.amount)
          
          if (takenAmount === bucket.amount) {
            // Full bucket consumed
            const duration = (event.timestamp - bucket.timestamp) / (1000 * 60 * 60 * 24) // days
            durations.push({
              pool: event.pool,
              duration,
              amount: takenAmount
            })
            bucketsByPool[event.pool].shift()
          } else {
            // Partial bucket consumed
            bucket.amount -= takenAmount
          }
          
          remainingAmount -= takenAmount
        }
      }
    })

    return durations
  }

  const SortableHeader = ({ field, children }: { field: keyof BorrowerData; children: React.ReactNode }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(field)}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Borrowers Explorer</h2>
          <p className="text-gray-600 mt-1">Position tracking by events & user profiles with DeepBook v3 metrics</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredAndSortedBorrowers.length} borrowers
        </div>
      </div>

      {/* DeepBook v3 Status */}
      {showDeepBookMetrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">DeepBook v3 Integration</span>
            </div>
            <button
              onClick={() => setShowDeepBookMetrics(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Hide
            </button>
          </div>
          <div className="mt-2 text-sm text-blue-700">
            {deepbookLoading ? 'Loading DeepBook v3 data...' : 
             deepbookError ? `Error: ${deepbookError}` :
             `Connected to ${positionSummaries.length} positions with real-time health metrics`}
          </div>
          {dashboardMetrics && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Total Positions:</span> {dashboardMetrics.total_positions}
              </div>
              <div>
                <span className="text-blue-600 font-medium">At Risk:</span> {dashboardMetrics.positions_at_risk}
              </div>
              <div>
                <span className="text-blue-600 font-medium">Avg Health:</span> {dashboardMetrics.average_health_factor.toFixed(2)}x
              </div>
              <div>
                <span className="text-blue-600 font-medium">Total Equity:</span> {formatUSD(String(Math.round(dashboardMetrics.total_net_equity_usd * 1000000000)))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search borrowers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-fg placeholder:text-fg/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            style={{
              backgroundColor: 'hsl(var(--surface))',
              color: 'hsl(var(--fg))',
              borderColor: 'hsl(var(--border))'
            }}
          />
        </div>
        {!showDeepBookMetrics && (
          <button
            onClick={() => setShowDeepBookMetrics(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Show DeepBook v3 Metrics
          </button>
        )}
      </div>

      {/* Borrowers Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">BORROWER</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">POOL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">LOAN AMOUNT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">STATUS</th>
                {showDeepBookMetrics && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">HEALTH FACTOR</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">NET EQUITY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">BORROW USAGE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">LIQUIDATION RISK</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredAndSortedBorrowers.map((borrower) => {
                const isExpanded = expandedBorrower === borrower.managerId
                const daysSinceFirstSeen = (Date.now() - borrower.firstSeen) / (1000 * 60 * 60 * 24)
                const daysSinceLastActivity = (Date.now() - borrower.lastActivity) / (1000 * 60 * 60 * 24)

                return (
                  <>
                    <tr 
                      key={borrower.managerId} 
                      className={`hover:bg-muted/50 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleBorrowerExpansion(borrower.managerId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fg font-medium">{borrower.owner}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">
                          {borrower.poolsUsed.join(', ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fg font-semibold">${(borrower.totalOutstandingDebt / 1000).toFixed(1)}K</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          borrower.repayRatio > 0.8 ? 'bg-success-500/20 text-success-400 border border-success-500/30' :
                          borrower.repayRatio > 0.5 ? 'bg-warning-500/20 text-warning-400 border border-warning-500/30' :
                          'bg-destructive-500/20 text-destructive-400 border border-destructive-500/30'
                        }`}>
                          {(borrower.repayRatio * 100).toFixed(1)}%
                        </span>
                      </td>
                      
                      {/* DeepBook v3 Metrics */}
                      {showDeepBookMetrics && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                            {borrower.deepbookPosition ? (
                              <span className="font-semibold">
                                {borrower.deepbookPosition.health_factor.toFixed(2)}x
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                            {borrower.deepbookPosition ? (
                              <span className={`font-semibold ${
                                borrower.deepbookPosition.net_equity_usd >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatUSD(String(Math.round(borrower.deepbookPosition.net_equity_usd * 1000000000)))}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                            {borrower.deepbookPosition ? (
                              <span className="font-medium">
                                {formatPercentage(String(Math.round(borrower.deepbookPosition.borrow_usage * 1000000000)))}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                            {borrower.deepbookPosition ? (
                              <span
                                className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full`}
                                style={{
                                  backgroundColor: getHealthStatusColor(borrower.deepbookPosition.health_status) + '20',
                                  color: getHealthStatusColor(borrower.deepbookPosition.health_status)
                                }}
                              >
                                {borrower.deepbookPosition.health_status}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                        </>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fg/90">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleBorrowerExpansion(borrower.managerId)
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
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>

          {filteredAndSortedBorrowers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No borrowers found</div>
              <div className="text-gray-400 text-sm mt-2">Try adjusting your search</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
