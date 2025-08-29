import React, { useState, useMemo, useEffect } from 'react'
import { useDeepBookData } from '../../hooks/useDeepBookData'
import pythPriceService from '../../services/pythPriceService'
import { BorrowersTable } from './BorrowersTable'
import { PortfolioPriceRiskAnalysis } from './PortfolioPriceRiskAnalysis'
import { PoolMetricsDashboard } from './PoolMetricsDashboard'
import { calculateBorrowersData, filterAndSortBorrowers } from './utils'
import type { BorrowersExplorerProps, BorrowerData } from './types'

export function BorrowersExplorer({ managers, loans, liquidations }: BorrowersExplorerProps) {
  const [expandedBorrower, setExpandedBorrower] = useState<string | null>(null)
  const [sortField, setSortField] = useState<keyof BorrowerData>('totalOutstandingDebt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeepBookMetrics, setShowDeepBookMetrics] = useState(true)
  const [selectedPoolId, setSelectedPoolId] = useState('')
  const [selectedPriceChange, setSelectedPriceChange] = useState<number>(-3)
  const [currentSuiPrice, setCurrentSuiPrice] = useState<number>(3.44)

  // Get DeepBook v3 data
  const { 
    positionSummaries, 
    dashboardMetrics, 
    loading: deepbookLoading, 
    error: deepbookError,
    data
  } = useDeepBookData()

  // Fetch current SUI price from Pyth
  useEffect(() => {
    const fetchSuiPrice = async () => {
      try {
        const assetInfo = await pythPriceService.getAssetPriceInfo('sui_usdc', 0)
        if (assetInfo) {
          setCurrentSuiPrice(assetInfo.currentPrice)
        }
      } catch (error) {
        console.error('Failed to fetch SUI price:', error)
        // Keep default price if fetch fails
      }
    }
    
    fetchSuiPrice()
  }, [])

  // Calculate borrower data with event-sourced positions
  const borrowersData = useMemo(() => {
    return calculateBorrowersData(managers, loans, liquidations, positionSummaries)
  }, [managers, loans, liquidations, positionSummaries])

  // Filter and sort borrowers
  const filteredAndSortedBorrowers = useMemo(() => {
    return filterAndSortBorrowers(borrowersData, searchTerm, sortField, sortDirection)
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
      <BorrowersTable
        borrowers={filteredAndSortedBorrowers}
        expandedBorrower={expandedBorrower}
        showDeepBookMetrics={showDeepBookMetrics}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onToggleExpansion={toggleBorrowerExpansion}
      />

      {/* Portfolio Price Risk Analysis */}
      {showDeepBookMetrics && dashboardMetrics && (
        <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
            <span className="text-orange-400 mr-3 text-2xl">⚠️</span>
            How Price Changes My Portfolio Risk
          </h3>
          
          {/* Enhanced Pool Information */}
          {expandedBorrower && (
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-slate-400">Asset Pool:</label>
                <span className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm">
                  {data?.margin_managers?.find(manager => manager.id === expandedBorrower)?.margin_pool_id || 'Unknown Pool'}
                </span>
              </div>
              
              {/* Pool Metrics Dashboard */}
              {(() => {
                // Fix: Use manager.id instead of manager.owner for the lookup
                const poolId = data?.margin_managers?.find(manager => manager.id === expandedBorrower)?.margin_pool_id || ''
                console.log('BorrowersExplorer Debug:', {
                  expandedBorrower,
                  poolId,
                  marginManagers: data?.margin_managers?.map(m => ({ id: m.id, owner: m.owner, margin_pool_id: m.margin_pool_id })),
                  deepbookPools: data?.deepbook_pools?.map(p => p.id),
                  marginPools: data?.margin_pools?.map(p => p.id)
                })
                return (
                  <PoolMetricsDashboard
                    selectedPoolId={poolId}
                    deepbookPools={data?.deepbook_pools}
                    marginPools={data?.margin_pools}
                    currentSuiPrice={currentSuiPrice}
                  />
                )
              })()}
            </div>
          )}
          
          <PortfolioPriceRiskAnalysis 
            positionSummaries={positionSummaries} 
            showDeepBookMetrics={showDeepBookMetrics}
            selectedPoolId={data?.margin_managers?.find(manager => manager.id === expandedBorrower)?.margin_pool_id || selectedPoolId}
            selectedPriceChange={selectedPriceChange}
            setSelectedPriceChange={setSelectedPriceChange}
            currentSuiPrice={currentSuiPrice}
            expandedBorrower={expandedBorrower}
            marginManagers={data?.margin_managers || []}
            deepbookPools={data?.deepbook_pools}
          />
        </div>
      )}
    </div>
  )
}
