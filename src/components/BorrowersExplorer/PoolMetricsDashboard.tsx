import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { InfoTooltip } from './InfoTooltip'
import type { DeepBookPool, MarginPool, PoolRiskRatios } from '../../types/deepbook'

interface PoolMetricsDashboardProps {
  selectedPoolId: string
  deepbookPools?: DeepBookPool[]
  marginPools?: MarginPool[]
  currentSuiPrice: number
}

export function PoolMetricsDashboard({ 
  selectedPoolId, 
  deepbookPools, 
  marginPools,
  currentSuiPrice 
}: PoolMetricsDashboardProps) {
  // Find the selected pool configuration
  const selectedPool = deepbookPools?.find(pool => pool.id === selectedPoolId)
  const baseMarginPool = marginPools?.find(pool => pool.id === selectedPool?.pool_config.base_margin_pool_id)
  const quoteMarginPool = marginPools?.find(pool => pool.id === selectedPool?.pool_config.quote_margin_pool_id)

  // Debug information
  console.log('PoolMetricsDashboard Debug:', {
    selectedPoolId,
    deepbookPools: deepbookPools?.map(p => p.id),
    marginPools: marginPools?.map(p => p.id),
    selectedPool,
    baseMarginPool,
    quoteMarginPool
  })

  if (!selectedPool) {
    return (
      <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-6 mb-6">
        <div className="text-center text-slate-400">
          <div className="text-lg mb-2">🏊‍♂️</div>
          <div className="text-sm">Pool not found</div>
          <div className="text-xs opacity-70">Select a valid pool to view metrics</div>
          <div className="text-xs opacity-50 mt-2">
            Debug: Pool ID "{selectedPoolId}" not found in {deepbookPools?.length || 0} available pools
          </div>
          <div className="text-xs opacity-50">
            Available pools: {deepbookPools?.map(p => p.id).join(', ') || 'None'}
          </div>
        </div>
      </div>
    )
  }

  // Convert Move contract values to decimal
  const convertRiskRatio = (riskRatio: string): number => parseInt(riskRatio) / 1000000000
  const convertInterestRate = (rate: string): number => parseInt(rate) / 1000000000
  const convertUtilization = (util: string): number => parseInt(util) / 1000000000

  // Pool risk thresholds
  const riskRatios = selectedPool.pool_config.risk_ratios
  const liquidationThreshold = convertRiskRatio(riskRatios.liquidation_risk_ratio)
  const targetLiquidationRatio = convertRiskRatio(riskRatios.target_liquidation_risk_ratio)
  const minBorrowRatio = convertRiskRatio(riskRatios.min_borrow_risk_ratio)
  const minWithdrawRatio = convertRiskRatio(riskRatios.min_withdraw_risk_ratio)

  // Interest rate data for charts
  const generateInterestRateData = () => {
    const data = []
    for (let utilization = 0; utilization <= 100; utilization += 5) {
      const utilRate = utilization / 100
      let interestRate = 0
      
      if (baseMarginPool) {
        const baseRate = convertInterestRate(baseMarginPool.base_rate || "0")
        const baseSlope = convertInterestRate(baseMarginPool.base_slope || "0")
        const optimalUtil = convertUtilization(baseMarginPool.optimal_utilization || "800000000")
        const excessSlope = convertInterestRate(baseMarginPool.excess_slope || "0")
        
        if (utilRate < optimalUtil) {
          interestRate = baseRate + (utilRate * baseSlope)
        } else {
          const excessUtil = utilRate - optimalUtil
          interestRate = baseRate + (optimalUtil * baseSlope) + (excessUtil * excessSlope)
        }
      }
      
      data.push({
        utilization: utilization,
        interestRate: interestRate * 100, // Convert to percentage
        optimalPoint: convertUtilization(baseMarginPool?.optimal_utilization || "800000000") * 100
      })
    }
    return data
  }

  const interestRateData = generateInterestRateData()

  return (
    <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
        <span className="text-blue-400 mr-3 text-2xl">🏊‍♂️</span>
        Pool Metrics & Risk Configuration
      </h3>

      {/* Pool Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-2">Pool ID</div>
          <div className="text-lg font-mono text-slate-200">{selectedPool.id}</div>
          <div className="text-xs text-slate-500 mt-1">
            {selectedPool.base_asset_type?.split('::').pop()} / {selectedPool.quote_asset_type?.split('::').pop()}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-2">Status</div>
          <div className={`text-lg font-semibold ${selectedPool.pool_config.enabled ? 'text-green-400' : 'text-red-400'}`}>
            {selectedPool.pool_config.enabled ? 'Active' : 'Paused'}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-2">User Reward</div>
          <div className="text-lg font-semibold text-blue-400">
            {(parseInt(selectedPool.pool_config.user_liquidation_reward) / 1000000000 * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Liquidation bonus</div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-2">Pool Reward</div>
          <div className="text-lg font-semibold text-purple-400">
            {(parseInt(selectedPool.pool_config.pool_liquidation_reward) / 1000000000 * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Protocol fee</div>
        </div>
      </div>

      {/* Risk Thresholds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-slate-200 mb-4">Risk Thresholds</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Liquidation Threshold</span>
              <span className="text-lg font-bold text-red-400">{liquidationThreshold.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Target After Liquidation</span>
              <span className="text-lg font-bold text-orange-400">{targetLiquidationRatio.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Minimum to Borrow</span>
              <span className="text-lg font-bold text-yellow-400">{minBorrowRatio.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Minimum to Withdraw</span>
              <span className="text-lg font-bold text-green-400">{minWithdrawRatio.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Interest Rate Curve */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-slate-200 mb-4">Interest Rate Curve</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={interestRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="utilization" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                  labelFormatter={(value) => `Utilization: ${value}%`}
                  formatter={(value: any) => [`${value.toFixed(2)}%`, 'Interest Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="interestRate" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
                <ReferenceLine
                  x={convertUtilization(baseMarginPool?.optimal_utilization || "800000000") * 100}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  label={{
                    value: 'Optimal',
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 10
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pool Utilization & Supply */}
      {baseMarginPool && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Base Asset Supply</div>
            <div className="text-lg font-semibold text-slate-200">
              ${(parseInt(baseMarginPool.total_supply || "0") / 1000000000).toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Cap: ${(parseInt(baseMarginPool.total_supply || "0") / 1000000000).toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Current Utilization</div>
            <div className="text-lg font-semibold text-slate-200">
              {(parseInt(baseMarginPool.utilization_rate || "0") / 1000000000 * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Optimal: {(convertUtilization(baseMarginPool.optimal_utilization || "800000000") * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Current Interest Rate</div>
            <div className="text-lg font-semibold text-slate-200">
              {(parseInt(baseMarginPool.current_rate || baseMarginPool.base_rate || "0") / 1000000000 * 100).toFixed(2)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">APY</div>
          </div>
        </div>
      )}

      {/* Risk Level Indicators */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-slate-200 mb-4">Risk Level Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm text-slate-400">Liquidatable</div>
            <div className="text-xs text-slate-500">&lt; {liquidationThreshold.toFixed(2)}x</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm text-slate-400">High Risk</div>
            <div className="text-xs text-slate-500">{liquidationThreshold.toFixed(2)}x - {targetLiquidationRatio.toFixed(2)}x</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm text-slate-400">Warning</div>
            <div className="text-xs text-slate-500">{targetLiquidationRatio.toFixed(2)}x - {minBorrowRatio.toFixed(2)}x</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto mb-2"></div>
            <div className="text-sm text-slate-400">Safe</div>
            <div className="text-xs text-slate-500">&gt; {minBorrowRatio.toFixed(2)}x</div>
          </div>
        </div>
      </div>

      {/* Pool Links */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-slate-200 mb-4">Connected Margin Pools</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-400 mb-2">Base Asset Pool</div>
            <div className="text-sm font-mono text-slate-200">
              {selectedPool.pool_config.base_margin_pool_id}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {selectedPool.base_asset_type?.split('::').pop() || 'Unknown Asset'}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-2">Quote Asset Pool</div>
            <div className="text-sm font-mono text-slate-200">
              {selectedPool.pool_config.quote_margin_pool_id}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {selectedPool.quote_asset_type?.split('::').pop() || 'Unknown Asset'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
