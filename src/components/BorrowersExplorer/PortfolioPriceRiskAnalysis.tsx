import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { InfoTooltip } from './InfoTooltip'
import { PriceLiquidationChart } from './PriceLiquidationChart'
import type { PortfolioPriceRiskAnalysisProps } from './types'
import type { PoolRiskRatios } from '../../types/deepbook'

export function PortfolioPriceRiskAnalysis({ 
  positionSummaries, 
  showDeepBookMetrics, 
  selectedPoolId, 
  selectedPriceChange, 
  setSelectedPriceChange, 
  currentSuiPrice, 
  expandedBorrower, 
  marginManagers,
  deepbookPools
}: PortfolioPriceRiskAnalysisProps) {
  const [customPriceChange, setCustomPriceChange] = useState<string>('-3')

  if (!showDeepBookMetrics || positionSummaries.length === 0) {
    return null
  }

  // Calculate portfolio-level metrics
  const totalAssetsUsd = positionSummaries.reduce((sum, pos) => sum + pos.base_asset_usd + pos.quote_asset_usd, 0)
  const totalDebtUsd = positionSummaries.reduce((sum, pos) => sum + pos.base_debt_usd + pos.quote_debt_usd, 0)
  const avgHealthFactor = positionSummaries.reduce((sum, pos) => sum + pos.health_factor, 0) / positionSummaries.length
  const positionsAtRisk = positionSummaries.filter(pos => pos.health_status !== 'healthy').length
  
  // Get selected borrower's health factor for more accurate risk analysis
  const selectedBorrowerHealthFactor = expandedBorrower ? 
    positionSummaries.find(pos => pos.manager_id === expandedBorrower)?.health_factor || avgHealthFactor :
    avgHealthFactor
  


  // Get pool risk thresholds from the selected pool
  const getPoolRiskThresholds = () => {
    // Debug logging
    console.log('PortfolioPriceRiskAnalysis Debug:', {
      selectedPoolId,
      deepbookPools: deepbookPools?.map(p => ({ id: p.id, risk_ratios: p.pool_config.risk_ratios })),
      hasDeepBookPools: !!deepbookPools,
      hasSelectedPoolId: !!selectedPoolId
    })
    
    // Must have pool data to proceed
    if (!deepbookPools || !selectedPoolId) {
      console.log('Missing pool data:', { deepbookPools: !!deepbookPools, selectedPoolId })
      return null
    }
    
    const selectedPool = deepbookPools.find(pool => pool.id === selectedPoolId)
    if (!selectedPool) {
      console.log('Pool not found:', { selectedPoolId, availablePools: deepbookPools.map(p => p.id) })
      return null
    }
    
    console.log('Found pool:', { 
      poolId: selectedPool.id, 
      risk_ratios: selectedPool.pool_config.risk_ratios 
    })
    
    // Convert Move contract risk ratios to decimal values
    const convertRiskRatio = (riskRatio: string): number => {
      return parseInt(riskRatio) / 1000000000
    }
    
    const thresholds = {
      TARGET_RISK_FACTOR: convertRiskRatio(selectedPool.pool_config.risk_ratios.target_liquidation_risk_ratio),
      SAFE_HEALTH_FACTOR: convertRiskRatio(selectedPool.pool_config.risk_ratios.min_borrow_risk_ratio),
      LIQUIDATION_THRESHOLD: convertRiskRatio(selectedPool.pool_config.risk_ratios.liquidation_risk_ratio),
      MIN_HEALTH_FACTOR: 0.1,         // Minimum health factor to prevent negative values
      PRICE_CHANGE_RANGE: 40,         // Range for price change analysis (-40% to +40%)
      QUICK_PRESETS: [-5, -3, -1, 1, 3, 5] as const
    }
    
    console.log('Calculated thresholds:', thresholds)
    return thresholds
  }

  const RISK_THRESHOLDS = getPoolRiskThresholds()
  
  // Show error if no pool thresholds available
  if (!RISK_THRESHOLDS) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 rounded-lg p-6 border border-red-600/50 text-center">
          <div className="text-xl font-bold text-red-300 mb-2">⚠️ Pool Configuration Error</div>
          <div className="text-red-200 mb-4">
            Unable to load risk thresholds for pool: <code className="bg-red-900/50 px-2 py-1 rounded">{selectedPoolId || 'No pool selected'}</code>
          </div>
          <div className="text-sm text-red-300">
            This could be due to:
          </div>
          <ul className="text-sm text-red-300 mt-2 space-y-1">
            <li>• Pool not found in DeepBook configuration</li>
            <li>• Missing risk ratio data</li>
            <li>• Network connectivity issues</li>
          </ul>
        </div>
      </div>
    )
  }

  // Detect unique pools for the selected borrower
  const selectedBorrowerPools = expandedBorrower ? 
    marginManagers
      ?.filter((manager) => manager.owner === expandedBorrower)
      ?.map((manager) => manager.margin_pool_id)
      ?.filter((poolId: string | null, index: number, arr: (string | null)[]) => poolId && arr.indexOf(poolId) === index) || [selectedPoolId] :
    [selectedPoolId]
  


  // Calculate portfolio risk after price change
  const calculatePortfolioRiskAfterPriceChange = (priceChangePercent: number) => {
    // Simplified calculation: assume linear relationship for demo
    const priceMultiplier = 1 + (priceChangePercent / 100)
    
    // Adjust health factor based on price change
    const newAvgHF = Math.max(RISK_THRESHOLDS.MIN_HEALTH_FACTOR, selectedBorrowerHealthFactor * priceMultiplier)
    
    // Adjust risk count
    const newPositionsAtRisk = priceChangePercent < 0 ? 
      Math.min(positionSummaries.length, positionsAtRisk + Math.ceil(Math.abs(priceChangePercent) / 2)) :
      Math.max(0, positionsAtRisk - Math.ceil(priceChangePercent / 3))
    
    return {
      avgHealthFactor: newAvgHF,
      positionsAtRisk: newPositionsAtRisk,
      isAtRisk: newAvgHF < RISK_THRESHOLDS.SAFE_HEALTH_FACTOR,
      isLiquidatable: newAvgHF < RISK_THRESHOLDS.LIQUIDATION_THRESHOLD
    }
  }

  const riskAfterChange = calculatePortfolioRiskAfterPriceChange(selectedPriceChange)
  
  // Generate data for the chart
  const chartData = Array.from({ length: RISK_THRESHOLDS.PRICE_CHANGE_RANGE * 2 + 1 }, (_, i) => {
    const priceChange = (i - RISK_THRESHOLDS.PRICE_CHANGE_RANGE) // -40% to +40% for smoother curves
    const risk = calculatePortfolioRiskAfterPriceChange(priceChange)
    return {
      priceChange,
      avgHealthFactor: risk.avgHealthFactor,
      liquidationThreshold: RISK_THRESHOLDS.LIQUIDATION_THRESHOLD,
      targetRiskFactor: RISK_THRESHOLDS.TARGET_RISK_FACTOR,
      currentPosition: selectedBorrowerHealthFactor
    }
  })
  
  // Debug chart data
  console.log('Chart data sample:', {
    firstPoint: chartData[0],
    lastPoint: chartData[chartData.length - 1],
    liquidationThreshold: RISK_THRESHOLDS.LIQUIDATION_THRESHOLD,
    targetRiskFactor: RISK_THRESHOLDS.TARGET_RISK_FACTOR,
    totalPoints: chartData.length
  })

  const quickPresets = RISK_THRESHOLDS.QUICK_PRESETS

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {quickPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setSelectedPriceChange(preset)
                setCustomPriceChange(preset.toString())
              }}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                selectedPriceChange === preset
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {preset > 0 ? `+${preset}%` : `${preset}%`}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400">Custom Price Change:</label>
          <input
            type="range"
            min={-RISK_THRESHOLDS.PRICE_CHANGE_RANGE}
            max={RISK_THRESHOLDS.PRICE_CHANGE_RANGE}
            value={selectedPriceChange}
            onChange={(e) => {
              const value = parseInt(e.target.value)
              setSelectedPriceChange(value)
              setCustomPriceChange(value.toString())
            }}
            className="flex-1 h-3 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <input
            type="text"
            value={customPriceChange}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0
              setCustomPriceChange(e.target.value)
              if (value >= -RISK_THRESHOLDS.PRICE_CHANGE_RANGE && value <= RISK_THRESHOLDS.PRICE_CHANGE_RANGE) {
                setSelectedPriceChange(value)
              }
            }}
            className="w-20 px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200 text-center"
            placeholder="-3"
          />
          <span className="text-sm text-slate-400">%</span>
        </div>
      </div>

      {/* Portfolio Risk Output Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-700/50 rounded-lg p-4 relative group">
          <div className="text-sm text-slate-400 mb-2 flex items-center">
            Portfolio Health Factor
            <InfoTooltip content="Total USD Assets ÷ Total USD Debt. Values above 1.0x mean you have more assets than debt.">
              <span className="ml-1 text-slate-500 cursor-help">ⓘ</span>
            </InfoTooltip>
          </div>
          <div className="text-2xl font-bold text-slate-200">
            {avgHealthFactor.toFixed(2)}x → {riskAfterChange.avgHealthFactor.toFixed(2)}x
          </div>
          <div className="text-sm mt-1">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              riskAfterChange.avgHealthFactor > RISK_THRESHOLDS.SAFE_HEALTH_FACTOR ? 'bg-green-900/50 text-green-300 border border-green-600/50' :
              riskAfterChange.avgHealthFactor > RISK_THRESHOLDS.TARGET_RISK_FACTOR ? 'bg-amber-900/50 text-amber-300 border border-amber-600/50' :
              'bg-red-900/50 text-red-300 border border-red-600/50'
            }`}>
              {riskAfterChange.avgHealthFactor > RISK_THRESHOLDS.SAFE_HEALTH_FACTOR ? 'Safe' :
               riskAfterChange.avgHealthFactor > RISK_THRESHOLDS.TARGET_RISK_FACTOR ? 'Caution' : 'Danger'}
            </span>
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4 relative group">
          <div className="text-sm text-slate-400 mb-2 flex items-center">
            Positions at Risk
            <InfoTooltip content="Number of positions with Health Factor below 1.2x (warning threshold). These positions are close to liquidation.">
              <span className="ml-1 text-slate-500 cursor-help">ⓘ</span>
            </InfoTooltip>
          </div>
          <div className="text-2xl font-bold text-slate-200">
            {positionsAtRisk}
          </div>
          <div className="text-sm text-slate-400">
            At Risk Now
          </div>
          <div className="text-lg font-bold text-slate-200 mt-2">
            {riskAfterChange.positionsAtRisk}
          </div>
          <div className="text-sm text-slate-400">
            At Risk if {selectedPriceChange > 0 ? '+' : ''}{selectedPriceChange}%
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4 relative group">
          <div className="text-sm text-slate-400 mb-2 flex items-center">
            Risk Level
            <InfoTooltip content={`SAFE: HF > ${RISK_THRESHOLDS.SAFE_HEALTH_FACTOR}x | HIGH: HF ${RISK_THRESHOLDS.LIQUIDATION_THRESHOLD}x-${RISK_THRESHOLDS.SAFE_HEALTH_FACTOR}x | CRITICAL: HF < ${RISK_THRESHOLDS.LIQUIDATION_THRESHOLD}x (liquidatable)`}>
              <span className="ml-1 text-slate-500 cursor-help">ⓘ</span>
            </InfoTooltip>
          </div>
          <div className={`text-2xl font-bold ${
            riskAfterChange.isLiquidatable ? 'text-red-400' :
            riskAfterChange.isAtRisk ? 'text-orange-400' : 'text-green-400'
          }`}>
            {riskAfterChange.isLiquidatable ? '🚨 CRITICAL' :
             riskAfterChange.isAtRisk ? '⚠️ HIGH' : '✅ SAFE'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Liquidation likely below {selectedPriceChange < 0 ? Math.abs(selectedPriceChange) : 0}% price move
          </div>
        </div>
      </div>

      {/* Portfolio Risk Summary and Price Card - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Risk Summary */}
        <div className={`p-4 rounded-lg border ${
          riskAfterChange.isLiquidatable 
            ? 'bg-red-900/30 border-red-600/50 text-red-200' 
            : riskAfterChange.isAtRisk
            ? 'bg-orange-900/30 border-orange-600/50 text-orange-200'
            : 'bg-slate-700/30 border-slate-600/50 text-green-200'
        }`}>
          <div className="text-lg font-medium mb-2">
            {riskAfterChange.isLiquidatable ? (
              <span className="text-red-300">🚨 PORTFOLIO LIQUIDATION RISK!</span>
            ) : riskAfterChange.isAtRisk ? (
              <span className="text-orange-300">⚠️ PORTFOLIO HIGH RISK</span>
            ) : (
              <span className="text-green-300">✅ PORTFOLIO SAFE</span>
            )}
          </div>
          <div className="text-sm">
            If your main assets move {selectedPriceChange > 0 ? '+' : ''}{selectedPriceChange}%, 
            your portfolio Health Factor {selectedPriceChange > 0 ? 'improves' : 'drops'} from {avgHealthFactor.toFixed(2)}x → {riskAfterChange.avgHealthFactor.toFixed(2)}x.
            {riskAfterChange.isAtRisk && ` ${riskAfterChange.positionsAtRisk} positions would be at risk.`}
          </div>
        </div>

        {/* Price at Selected Risk Level Card */}
        <div className={`p-4 rounded-lg border ${
          riskAfterChange.isLiquidatable 
            ? 'bg-red-900/30 border-red-600/50 text-red-200' 
            : riskAfterChange.isAtRisk
            ? 'bg-orange-900/30 border-orange-600/50 text-orange-200'
            : 'bg-slate-700/30 border-slate-600/50 text-green-200'
        }`}>
          <div className="text-center">
            <div className="text-xs mb-2 opacity-80">Price at Selected Risk Level</div>
            <div className={`text-2xl font-bold mb-1 ${
              riskAfterChange.isLiquidatable 
                ? 'text-red-300' 
                : riskAfterChange.isAtRisk
                ? 'text-orange-300'
                : 'text-green-300'
            }`}>
              ${(currentSuiPrice * (1 + selectedPriceChange / 100)).toFixed(2)}
            </div>
            <div className="text-sm opacity-80">
              {selectedPriceChange > 0 ? '+' : ''}{selectedPriceChange}% from current
            </div>
            <div className="text-xs opacity-60 mt-1">
              Base: ${currentSuiPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Post-Liquidation Position Card */}
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-2">Post-Liquidation Position</div>
            <div className="text-lg font-bold text-purple-300 mb-1">
              {RISK_THRESHOLDS.TARGET_RISK_FACTOR.toFixed(2)}x Health Factor
            </div>
            <div className="text-sm text-slate-400">
              After liquidation, you'd be reset to {RISK_THRESHOLDS.TARGET_RISK_FACTOR.toFixed(1)}x
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Protocol safety threshold
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Pool Detection */}
      {selectedBorrowerPools.length > 1 && (
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-600/30">
          <div className="text-center">
            <div className="text-sm text-blue-300 mb-2">
              🌐 <strong>Multi-Pool Borrower Detected!</strong>
            </div>
            <div className="text-xs text-blue-200 mb-3">
              This borrower has positions in {selectedBorrowerPools.length} different pools:
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {selectedBorrowerPools.map((poolId: string | null) => poolId && (
                <div key={poolId} className="bg-blue-800/30 px-3 py-1 rounded-full text-xs text-blue-200 border border-blue-600/50">
                  {poolId}
                </div>
              ))}
            </div>
            <div className="text-xs text-blue-300 mt-3">
              💡 <strong>Coming Soon:</strong> Individual sliders for each pool to analyze risk per asset
            </div>
          </div>
        </div>
      )}

      {/* Pool Thresholds Debug Panel */}
      <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-600/30">
        <div className="text-sm text-blue-300 mb-3 text-center">
          🔧 <strong>Pool Risk Thresholds (Live from Move Contract)</strong>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-blue-200 mb-1">Liquidation Threshold</div>
            <div className="text-lg font-bold text-red-400">{RISK_THRESHOLDS.LIQUIDATION_THRESHOLD.toFixed(2)}x</div>
            <div className="text-xs text-blue-300">Below this = liquidatable</div>
          </div>
          <div>
            <div className="text-xs text-blue-200 mb-1">Target Risk Factor</div>
            <div className="text-lg font-bold text-purple-400">{RISK_THRESHOLDS.TARGET_RISK_FACTOR.toFixed(2)}x</div>
            <div className="text-xs text-blue-300">Post-liquidation health</div>
          </div>
          <div>
            <div className="text-xs text-blue-200 mb-1">Safe Health Factor</div>
            <div className="text-lg font-bold text-green-400">{RISK_THRESHOLDS.SAFE_HEALTH_FACTOR.toFixed(2)}x</div>
            <div className="text-xs text-blue-300">Above this = safe</div>
          </div>
          <div>
            <div className="text-xs text-blue-200 mb-1">Pool ID</div>
            <div className="text-lg font-bold text-blue-300">{selectedPoolId}</div>
            <div className="text-xs text-blue-300">Source: DeepBook v3</div>
          </div>
        </div>
      </div>

      {/* Implementation Status Note */}
      <div className="bg-slate-800/20 rounded-lg p-3 border border-slate-600/30">
        <div className="text-xs text-slate-400 text-center">
          💡 <strong>Current Implementation:</strong> Single pool analysis for {expandedBorrower ? 'selected borrower' : 'portfolio average'}. 
          Multi-pool sliders coming soon when pool_id data is available.
        </div>
      </div>

      {/* Portfolio Risk Charts - Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Portfolio Risk Chart */}
        <div className="h-64 bg-slate-800/20 rounded-lg p-4 border border-slate-600/30">
          <div className="text-xs text-slate-400 mb-2 text-center">
            💡 <strong>Target Risk Factor ({RISK_THRESHOLDS.TARGET_RISK_FACTOR.toFixed(2)}x):</strong> When positions are liquidated, collateral is sold to restore them to this health level
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="priceChange" 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                domain={[-RISK_THRESHOLDS.PRICE_CHANGE_RANGE, RISK_THRESHOLDS.PRICE_CHANGE_RANGE]}
                ticks={[-40, -30, -20, -10, 0, 10, 20, 30, 40]}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                domain={[0.5, Math.max(2.5, selectedBorrowerHealthFactor + 0.5)]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
                labelFormatter={(value) => `Price Change: ${value > 0 ? '+' : ''}${value}%`}
                formatter={(value: any, name: any, props: any) => {
                  if (name === 'avgHealthFactor') {
                    return [`${value.toFixed(2)}x`, 'Health Factor']
                  } else if (name === 'liquidationThreshold') {
                    return [`${RISK_THRESHOLDS.LIQUIDATION_THRESHOLD.toFixed(2)}x`, 'Liquidation Threshold']
                  } else if (name === 'targetRiskFactor') {
                    return [`${RISK_THRESHOLDS.TARGET_RISK_FACTOR.toFixed(2)}x`, 'Target Risk Factor']
                  } else if (name === 'currentPosition') {
                    return [`${selectedBorrowerHealthFactor.toFixed(2)}x`, 'Current Position']
                  }
                  return [value, name]
                }}
              />
              <Line 
                type="monotone" 
                dataKey="avgHealthFactor" 
                stroke="#3b82f6" 
                strokeWidth={4}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
              {/* Liquidation threshold line */}
              <Line 
                type="monotone" 
                dataKey="liquidationThreshold" 
                stroke="#ef4444" 
                strokeWidth={3}
                strokeDasharray="0"
              />
              {/* Target risk factor line (where liquidated positions are restored to) */}
              <Line 
                type="monotone" 
                dataKey="targetRiskFactor" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                strokeDasharray="0"
              />
              {/* Current position marker */}
              <Line 
                type="monotone" 
                dataKey="currentPosition" 
                stroke="#10b981" 
                strokeWidth={5}
                strokeDasharray="0"
              />
              {/* Reference line for current slider position */}
              <ReferenceLine
                x={selectedPriceChange}
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="0"
                label={{
                  value: `${selectedPriceChange > 0 ? '+' : ''}${selectedPriceChange}%`,
                  position: 'top',
                  fill: '#f59e0b',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-sm text-slate-400 text-center mt-3">
            <span className="inline-block w-5 h-1.5 bg-blue-500 mr-2 rounded"></span>Portfolio Health Factor
            <span className="inline-block w-5 h-1.5 bg-red-500 mx-3"></span>Liquidation ({RISK_THRESHOLDS.LIQUIDATION_THRESHOLD.toFixed(2)}x)
            <span className="inline-block w-5 h-1.5 bg-purple-500 mx-2 rounded"></span>Target Risk Factor ({RISK_THRESHOLDS.TARGET_RISK_FACTOR.toFixed(2)}x)
            <span className="inline-block w-5 h-1.5 bg-green-500 mx-2 rounded"></span>Current Portfolio
            <span className="inline-block w-5 h-1.5 bg-orange-500 mx-2 rounded"></span>Slider Position
          </div>
        </div>

        {/* Right: Price vs Liquidation Chart */}
        <div className="h-64">
          <PriceLiquidationChart
            poolId={selectedPoolId}
            selectedPriceChange={selectedPriceChange}
            onPriceChange={setSelectedPriceChange}
          />
        </div>
      </div>
    </div>
  )
}

