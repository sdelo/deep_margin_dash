import React, { useState, useMemo } from 'react'
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

// Price Risk Analysis Component
interface PriceRiskAnalysisProps {
  borrower: BorrowerData
  showDeepBookMetrics: boolean
}

function PriceRiskAnalysis({ borrower, showDeepBookMetrics }: PriceRiskAnalysisProps) {
  const [selectedPriceChange, setSelectedPriceChange] = useState<number>(-3)
  const [customPriceChange, setCustomPriceChange] = useState<string>('-3')

  if (!showDeepBookMetrics || !borrower.deepbookPosition) {
    return null
  }

  const position = borrower.deepbookPosition
  const currentHF = position.health_factor
  const currentBorrowUsed = position.borrow_usage
  const currentLiqBuffer = position.distance_to_liquidation

  // Calculate risk metrics after price change
  const calculateRiskAfterPriceChange = (priceChangePercent: number) => {
    // Simplified calculation: assume linear relationship for demo
    // In reality, this would use the actual position math from DeepBook v3
    const priceMultiplier = 1 + (priceChangePercent / 100)
    
    // Adjust health factor based on price change
    // This is a simplified model - real calculation would be more complex
    const newHF = Math.max(0.1, currentHF * priceMultiplier)
    
    // Adjust borrow usage (inverse relationship with HF)
    const newBorrowUsed = Math.min(100, currentBorrowUsed / priceMultiplier)
    
    // Adjust liquidation buffer
    const newLiqBuffer = Math.max(0, currentLiqBuffer - Math.abs(priceChangePercent))
    
    return {
      healthFactor: newHF,
      borrowUsed: newBorrowUsed,
      liquidationBuffer: newLiqBuffer,
      isAtRisk: newHF < 1.1,
      isLiquidatable: newHF < 1.0
    }
  }

  const riskAfterChange = calculateRiskAfterPriceChange(selectedPriceChange)
  
  // Generate data for the chart
  const chartData = Array.from({ length: 41 }, (_, i) => {
    const priceChange = (i - 20) // -20% to +20%
    const risk = calculateRiskAfterPriceChange(priceChange)
    return {
      priceChange,
      healthFactor: risk.healthFactor,
      borrowUsed: risk.borrowUsed,
      liquidationBuffer: risk.liquidationBuffer
    }
  })

  const quickPresets = [-5, -3, -1, 1, 3, 5]

  return (
    <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
        <span className="text-orange-400 mr-2">⚠️</span>
        How Price Changes My Risk
      </h4>
      
      {/* Scenario Selection */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setSelectedPriceChange(preset)
                setCustomPriceChange(preset.toString())
              }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedPriceChange === preset
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {preset > 0 ? `+${preset}%` : `${preset}%`}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Custom:</label>
          <input
            type="range"
            min="-20"
            max="20"
            value={selectedPriceChange}
            onChange={(e) => {
              const value = parseInt(e.target.value)
              setSelectedPriceChange(value)
              setCustomPriceChange(value.toString())
            }}
            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <input
            type="text"
            value={customPriceChange}
            onChange={(e) => {
              const value = e.target.value
              setCustomPriceChange(value)
              const numValue = parseFloat(value)
              if (!isNaN(numValue) && numValue >= -20 && numValue <= 20) {
                setSelectedPriceChange(numValue)
              }
            }}
            className="w-16 px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded border border-slate-600 text-center"
            placeholder="-3"
          />
          <span className="text-xs text-slate-400">%</span>
        </div>
      </div>

      {/* Risk Output Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">Health Factor</div>
          <div className="text-lg font-bold text-slate-200">
            <span className={currentHF >= 1.1 ? 'text-green-400' : 'text-orange-400'}>
              {currentHF.toFixed(2)}x
            </span>
            <span className="text-slate-400 mx-2">→</span>
            <span className={riskAfterChange.healthFactor >= 1.1 ? 'text-green-400' : 'text-orange-400'}>
              {riskAfterChange.healthFactor.toFixed(2)}x
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">Borrow Used %</div>
          <div className="text-lg font-bold text-slate-200">
            <span className={currentBorrowUsed < 85 ? 'text-green-400' : 'text-orange-400'}>
              {currentBorrowUsed.toFixed(1)}%
            </span>
            <span className="text-slate-400 mx-2">→</span>
            <span className={riskAfterChange.borrowUsed < 85 ? 'text-green-400' : 'text-orange-400'}>
              {riskAfterChange.borrowUsed.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">Liq Buffer</div>
          <div className="text-lg font-bold text-slate-200">
            <span className={currentLiqBuffer > 15 ? 'text-green-400' : 'text-orange-400'}>
              -{currentLiqBuffer.toFixed(1)}%
            </span>
            <span className="text-slate-400 mx-2">→</span>
            <span className={riskAfterChange.liquidationBuffer > 15 ? 'text-green-400' : 'text-orange-400'}>
              -{riskAfterChange.liquidationBuffer.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <div className={`p-3 rounded-lg border ${
        riskAfterChange.isLiquidatable 
          ? 'bg-red-900/30 border-red-600/50 text-red-200' 
          : riskAfterChange.isAtRisk
          ? 'bg-orange-900/30 border-orange-600/50 text-orange-200'
          : 'bg-slate-700/30 border-slate-600/50 text-slate-200'
      }`}>
        <div className="text-sm font-medium">
          {riskAfterChange.isLiquidatable ? (
            <span className="text-red-300">🚨 LIQUIDATION RISK!</span>
          ) : riskAfterChange.isAtRisk ? (
            <span className="text-orange-300">⚠️ HIGH RISK</span>
          ) : (
            <span className="text-green-300">✅ SAFE</span>
          )}
        </div>
        <div className="text-xs mt-1">
          If {borrower.poolsUsed[0] || 'SUI'} moves {selectedPriceChange > 0 ? '+' : ''}{selectedPriceChange}%, 
          your Health Factor {selectedPriceChange > 0 ? 'improves' : 'drops'} from {currentHF.toFixed(2)}x → {riskAfterChange.healthFactor.toFixed(2)}x.
          {riskAfterChange.isAtRisk && ` You'd be within ${riskAfterChange.liquidationBuffer.toFixed(1)}% of liquidation.`}
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mt-4 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="priceChange" 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              domain={[0, Math.max(3, currentHF * 1.5)]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
              labelFormatter={(value) => `Price Change: ${value > 0 ? '+' : ''}${value}%`}
              formatter={(value: any) => [`HF: ${value.toFixed(2)}x`, 'Health Factor']}
            />
            <Line 
              type="monotone" 
              dataKey="healthFactor" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
            />
            {/* Liquidation threshold line */}
            <Line 
              type="monotone" 
              dataKey="liquidationThreshold" 
              stroke="#ef4444" 
              strokeWidth={1}
              strokeDasharray="5 5"
              data={chartData.map(() => ({ priceChange: 0, liquidationThreshold: 1.0 }))}
            />
            {/* Current position marker */}
            <Line 
              type="monotone" 
              dataKey="currentPosition" 
              stroke="#10b981" 
              strokeWidth={3}
              data={chartData.map(() => ({ priceChange: 0, currentPosition: currentHF }))}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs text-slate-400 text-center mt-2">
          <span className="inline-block w-3 h-0.5 bg-blue-500 mr-1"></span>Health Factor
          <span className="inline-block w-3 h-0.5 bg-red-500 mx-2 border-dashed"></span>Liquidation (1.0x)
          <span className="inline-block w-3 h-0.5 bg-green-500 mx-2"></span>Current Position
        </div>
      </div>
    </div>
  )
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
    error: deepbookError,
    data
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
      {/* Custom CSS for slider */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
      `}</style>
      
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

      {/* Enhanced DeepBook v3 Status Card */}
      {showDeepBookMetrics && (
        <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm font-medium text-blue-300">DeepBook v3 Integration</span>
            </div>
            <button
              onClick={() => setShowDeepBookMetrics(false)}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Hide
            </button>
          </div>
          
          {/* Enhanced Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div>
              <span className="text-blue-300 font-medium">Total Positions:</span> 
              <span className="text-slate-200 ml-1">{dashboardMetrics?.total_positions || 0}</span>
            </div>
            <div>
              <span className="text-blue-300 font-medium">At Risk:</span> 
              <span className="text-slate-200 ml-1">{dashboardMetrics?.positions_at_risk || 0}</span>
            </div>
            <div>
              <span className="text-blue-300 font-medium">Avg Health:</span> 
              <span className="text-slate-200 ml-1">{dashboardMetrics?.average_health_factor.toFixed(2) || '0.00'}x</span>
            </div>
            <div>
              <span className="text-blue-300 font-medium">Total Equity:</span> 
              <span className="text-slate-200 ml-1">{dashboardMetrics ? formatUSD(String(Math.round(dashboardMetrics.total_net_equity_usd * 1000000000))) : '$0.00'}</span>
            </div>
          </div>

          {/* New Enhanced Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-slate-600/50 pt-3">
            <div>
              <span className="text-blue-300 font-medium">Oracle Freshness:</span>
              <div className="text-slate-200">
                {data?.last_updated ? 
                  `${Math.round((Date.now() - data.last_updated) / 1000)}s ago` : 
                  'Unknown'
                }
              </div>
            </div>
            <div>
              <span className="text-blue-300 font-medium">Weighted Borrow APR:</span>
              <div className="text-slate-200">
                {data?.margin_pools.length ? 
                  `${(data.margin_pools.reduce((sum, pool) => sum + parseInt(pool.current_rate || '0'), 0) / data.margin_pools.length / 10000000).toFixed(2)}%` : 
                  'N/A'
                }
              </div>
            </div>
            <div>
              <span className="text-blue-300 font-medium">Encumbered (Orders):</span>
              <div className="text-slate-200">$0.00</div>
            </div>
            <div>
              <span className="text-blue-300 font-medium">Data Mode:</span>
              <div className="text-slate-200">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  data?.data_source === 'static' ? 'bg-slate-700 text-slate-200 border border-slate-500' :
                  data?.data_source === 'rpc' ? 'bg-emerald-700/50 text-emerald-300 border border-emerald-500/50' :
                  'bg-blue-700/50 text-blue-300 border border-blue-500/50'
                }`}>
                  {data?.data_source?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Price Risk Analysis */}
      {showDeepBookMetrics && dashboardMetrics && (
        <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
            <span className="text-orange-400 mr-2">📊</span>
            Portfolio Risk Analysis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Avg Health Factor:</span>
              <div className="text-slate-200 font-medium">
                {dashboardMetrics.average_health_factor.toFixed(2)}x
              </div>
            </div>
            <div>
              <span className="text-slate-400">Positions at Risk:</span>
              <div className="text-slate-200 font-medium">
                {dashboardMetrics.positions_at_risk} / {dashboardMetrics.total_positions}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Total Net Equity:</span>
              <div className={`font-medium ${
                dashboardMetrics.total_net_equity_usd >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatUSD(String(Math.round(dashboardMetrics.total_net_equity_usd * 1000000000)))}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Risk Level:</span>
              <div className={`font-medium ${
                dashboardMetrics.positions_at_risk === 0 ? 'text-green-400' :
                dashboardMetrics.positions_at_risk <= 1 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {dashboardMetrics.positions_at_risk === 0 ? 'Low' :
                 dashboardMetrics.positions_at_risk <= 1 ? 'Medium' : 'High'}
              </div>
            </div>
          </div>
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
              {filteredAndSortedBorrowers.map((borrower) => {
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
                      onClick={() => toggleBorrowerExpansion(borrower.managerId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fg font-medium">{borrower.owner}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">
                          {borrower.poolsUsed.join(', ')}
                        </span>
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

                            {/* Price Risk Analysis Widget */}
                            <PriceRiskAnalysis key={`risk-${borrower.managerId}`} borrower={borrower} showDeepBookMetrics={showDeepBookMetrics} />

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
