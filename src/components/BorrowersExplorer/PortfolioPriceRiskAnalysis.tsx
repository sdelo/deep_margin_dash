import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { InfoTooltip } from './InfoTooltip'
import type { PortfolioPriceRiskAnalysisProps } from './types'

export function PortfolioPriceRiskAnalysis({ 
  positionSummaries, 
  showDeepBookMetrics, 
  selectedPoolId, 
  selectedPriceChange, 
  setSelectedPriceChange, 
  currentSuiPrice, 
  expandedBorrower, 
  marginManagers 
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
  
  // Detect unique pools for the selected borrower
  const selectedBorrowerPools = expandedBorrower ? 
    marginManagers
      ?.filter((manager) => manager.owner === expandedBorrower)
      ?.map((manager) => manager.margin_pool_id)
      ?.filter((poolId: string | null, index: number, arr: (string | null)[]) => poolId && arr.indexOf(poolId) === index) || [selectedPoolId] :
    [selectedPoolId]
  
  // Target risk factor is typically set at pool level (e.g., 1.1x means liquidated positions are restored to 110% health)
  const targetRiskFactor = 1.1

  // Calculate portfolio risk after price change
  const calculatePortfolioRiskAfterPriceChange = (priceChangePercent: number) => {
    // Simplified calculation: assume linear relationship for demo
    const priceMultiplier = 1 + (priceChangePercent / 100)
    
    // Adjust health factor based on price change
    const newAvgHF = Math.max(0.1, selectedBorrowerHealthFactor * priceMultiplier)
    
    // Adjust risk count
    const newPositionsAtRisk = priceChangePercent < 0 ? 
      Math.min(positionSummaries.length, positionsAtRisk + Math.ceil(Math.abs(priceChangePercent) / 2)) :
      Math.max(0, positionsAtRisk - Math.ceil(priceChangePercent / 3))
    
    return {
      avgHealthFactor: newAvgHF,
      positionsAtRisk: newPositionsAtRisk,
      isAtRisk: newAvgHF < 1.2,
      isLiquidatable: newAvgHF < 1.0
    }
  }

  const riskAfterChange = calculatePortfolioRiskAfterPriceChange(selectedPriceChange)
  
  // Generate data for the chart
  const chartData = Array.from({ length: 81 }, (_, i) => {
    const priceChange = (i - 40) // -40% to +40% for smoother curves
    const risk = calculatePortfolioRiskAfterPriceChange(priceChange)
    return {
      priceChange,
      avgHealthFactor: risk.avgHealthFactor,
      liquidationThreshold: 1.0,
      targetRiskFactor: targetRiskFactor,
      currentPosition: selectedBorrowerHealthFactor
    }
  })

  const quickPresets = [-5, -3, -1, 1, 3, 5]

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
            min="-40"
            max="40"
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
              if (value >= -40 && value <= 40) {
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
              riskAfterChange.avgHealthFactor > 1.3 ? 'bg-green-900/50 text-green-300 border border-green-600/50' :
              riskAfterChange.avgHealthFactor > 1.1 ? 'bg-amber-900/50 text-amber-300 border border-amber-600/50' :
              'bg-red-900/50 text-red-300 border border-red-600/50'
            }`}>
              {riskAfterChange.avgHealthFactor > 1.3 ? 'Safe' :
               riskAfterChange.avgHealthFactor > 1.1 ? 'Caution' : 'Danger'}
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
            <InfoTooltip content="SAFE: HF > 1.2x | HIGH: HF 1.0x-1.2x | CRITICAL: HF < 1.0x (liquidatable)">
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
              {targetRiskFactor.toFixed(2)}x Health Factor
            </div>
            <div className="text-sm text-slate-400">
              After liquidation, you'd be reset to {targetRiskFactor.toFixed(1)}x
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
                  {poolId === 'pool_001' ? 'SUI/USDC' : 
                   poolId === 'pool_002' ? 'WETH/USDC' : 
                   poolId === 'pool_003' ? 'USDC' : poolId}
                </div>
              ))}
            </div>
            <div className="text-xs text-blue-300 mt-3">
              💡 <strong>Coming Soon:</strong> Individual sliders for each pool to analyze risk per asset
            </div>
          </div>
        </div>
      )}

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
            💡 <strong>Target Risk Factor (1.10x):</strong> When positions are liquidated, collateral is sold to restore them to this health level
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="priceChange" 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                domain={[-40, 40]}
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
                    return ['1.00x', 'Liquidation Threshold']
                  } else if (name === 'targetRiskFactor') {
                    return [`${targetRiskFactor.toFixed(2)}x`, 'Target Risk Factor']
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
            <span className="inline-block w-5 h-1.5 bg-red-500 mx-3"></span>Liquidation (1.0x)
            <span className="inline-block w-5 h-1.5 bg-purple-500 mx-2 rounded"></span>Target Risk Factor
            <span className="inline-block w-5 h-1.5 bg-green-500 mx-2 rounded"></span>Current Portfolio
            <span className="inline-block w-5 h-1.5 bg-orange-500 mx-2 rounded"></span>Slider Position
          </div>
        </div>

        {/* Right: Price vs Liquidation Chart */}
        <div className="h-64">
          {/* This will be replaced by the PriceLiquidationChart component */}
          <div className="h-full bg-slate-800/20 rounded-lg p-4 border border-slate-600/30 flex items-center justify-center">
            <div className="text-slate-400 text-center">
              <div className="text-lg mb-2">📊</div>
              <div className="text-sm">Price Liquidation Chart</div>
              <div className="text-xs opacity-70">Component will be imported here</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
