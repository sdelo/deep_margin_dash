import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { MarginManager, MarginLoan, MarginLiquidation } from '../services/api'

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
  }, [managers, loans, liquidations])

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
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
          <p className="text-gray-600 mt-1">Position tracking by events & user profiles</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredAndSortedBorrowers.length} borrowers
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Borrowers</label>
          <input
            type="text"
            placeholder="Search by owner, manager ID, or pool..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Borrowers Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader field="owner">Owner</SortableHeader>
                <SortableHeader field="firstSeen">First Seen</SortableHeader>
                <SortableHeader field="lastActivity">Last Activity</SortableHeader>
                <SortableHeader field="poolsUsed">Pools Used</SortableHeader>
                <SortableHeader field="totalOutstandingDebt">Outstanding Debt</SortableHeader>
                <SortableHeader field="borrowCount">#Borrows</SortableHeader>
                <SortableHeader field="repayCount">#Repays</SortableHeader>
                <SortableHeader field="liquidationCount">#Liquidations</SortableHeader>
                <SortableHeader field="defaultSum">Default Sum</SortableHeader>
                <SortableHeader field="repayRatio">Repay Ratio</SortableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedBorrowers.map((borrower) => {
                const isExpanded = expandedBorrower === borrower.managerId
                const daysSinceFirstSeen = (Date.now() - borrower.firstSeen) / (1000 * 60 * 60 * 24)
                const daysSinceLastActivity = (Date.now() - borrower.lastActivity) / (1000 * 60 * 60 * 24)

                return (
                  <>
                    <tr 
                      key={borrower.managerId} 
                      className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleBorrowerExpansion(borrower.managerId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{borrower.owner.substring(0, 8)}...</div>
                          <div className="text-gray-500 text-xs font-mono">{borrower.managerId.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(borrower.firstSeen).toLocaleDateString()}</div>
                          <div className="text-gray-500 text-xs">{daysSinceFirstSeen.toFixed(0)} days ago</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(borrower.lastActivity).toLocaleDateString()}</div>
                          <div className="text-gray-500 text-xs">{daysSinceLastActivity.toFixed(0)} days ago</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {borrower.poolsUsed.map(pool => (
                            <span key={pool} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {pool}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">
                            ${(borrower.totalOutstandingDebt / 1000).toFixed(1)}K
                          </div>
                          <div className="text-xs text-gray-500">
                            {Object.entries(borrower.outstandingDebtByPool)
                              .filter(([_, debt]) => debt > 0)
                              .map(([pool, debt]) => `${pool}: $${(debt / 1000).toFixed(1)}K`)
                              .join(', ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {borrower.borrowCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {borrower.repayCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${
                          borrower.liquidationCount > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {borrower.liquidationCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${
                          borrower.defaultSum > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${(borrower.defaultSum / 1000).toFixed(1)}K
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          borrower.repayRatio >= 80 ? 'bg-green-100 text-green-800' :
                          borrower.repayRatio >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {borrower.repayRatio.toFixed(1)}%
                        </span>
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
                        <td colSpan={11} className="px-6 py-6 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Event Timeline */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">Event Timeline</h4>
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {borrower.events.map((event, index) => (
                                  <div key={index} className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                                      event.type === 'created' ? 'bg-gray-400' :
                                      event.type === 'borrow' ? 'bg-blue-500' :
                                      event.type === 'repay' ? 'bg-green-500' :
                                      'bg-red-500'
                                    }`}></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${
                                          event.type === 'created' ? 'text-gray-700' :
                                          event.type === 'borrow' ? 'text-blue-700' :
                                          event.type === 'repay' ? 'text-green-700' :
                                          'text-red-700'
                                        }`}>
                                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(event.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                      {event.pool && (
                                        <div className="text-sm text-gray-600">
                                          Pool: {event.pool}
                                        </div>
                                      )}
                                      {event.amount && (
                                        <div className="text-sm text-gray-600">
                                          Amount: ${(event.amount / 1000).toFixed(1)}K
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Loan Duration Analysis */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">Loan Duration Analysis</h4>
                              {(() => {
                                const durations = calculateLoanDurations(borrower)
                                
                                if (durations.length === 0) {
                                  return (
                                    <div className="text-gray-500 text-sm">
                                      No completed loan cycles yet
                                    </div>
                                  )
                                }

                                const avgDuration = durations.reduce((sum, d) => sum + d.duration, 0) / durations.length
                                const durationsByPool = durations.reduce((acc, d) => {
                                  if (!acc[d.pool]) acc[d.pool] = []
                                  acc[d.pool].push(d.duration)
                                  return acc
                                }, {} as Record<string, number[]>)

                                return (
                                  <div className="space-y-4">
                                    <div className="bg-white p-4 rounded border">
                                      <div className="text-sm font-medium text-gray-700">Average Loan Duration</div>
                                      <div className="text-2xl font-bold text-blue-600">
                                        {avgDuration.toFixed(1)} days
                                      </div>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded border">
                                      <div className="text-sm font-medium text-gray-700 mb-3">Duration by Pool</div>
                                      <div className="space-y-2">
                                        {Object.entries(durationsByPool).map(([pool, poolDurations]) => {
                                          const avgPoolDuration = poolDurations.reduce((sum, d) => sum + d, 0) / poolDurations.length
                                          return (
                                            <div key={pool} className="flex justify-between items-center">
                                              <span className="text-sm text-gray-600">{pool}</span>
                                              <span className="text-sm font-medium">
                                                {avgPoolDuration.toFixed(1)} days ({poolDurations.length} loans)
                                              </span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>

                                    {/* Duration Chart */}
                                    <div className="bg-white p-4 rounded border">
                                      <div className="text-sm font-medium text-gray-700 mb-3">Duration Trend</div>
                                      <div className="h-32">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={durations.slice(-10).map((d, i) => ({ 
                                            index: i + 1, 
                                            duration: d.duration,
                                            pool: d.pool 
                                          }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="index" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} days`, 'Duration']} />
                                            <Line type="monotone" dataKey="duration" stroke="#3b82f6" strokeWidth={2} />
                                          </LineChart>
                                        </ResponsiveContainer>
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
