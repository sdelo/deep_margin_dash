import React, { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import pythPriceService from '../services/pythPriceService'
import type { AssetPriceInfo } from '../types/pyth'

interface PriceLiquidationChartProps {
  poolId: string
  selectedPriceChange: number
  onPriceChange: (priceChange: number) => void
}

export function PriceLiquidationChart({ 
  poolId, 
  selectedPriceChange, 
  onPriceChange 
}: PriceLiquidationChartProps) {
  const [assetPriceInfo, setAssetPriceInfo] = useState<AssetPriceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch price data when pool or price change updates
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true)
        setError(null)
        const priceInfo = await pythPriceService.getAssetPriceInfo(poolId, selectedPriceChange)
        setAssetPriceInfo(priceInfo)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch price data')
      } finally {
        setLoading(false)
      }
    }

    fetchPriceData()
  }, [poolId, selectedPriceChange])

  // Generate chart data for price visualization
  const chartData = useMemo(() => {
    if (!assetPriceInfo) return []

    const data = []
    const currentPrice = assetPriceInfo.currentPrice
    const liquidationPrice = assetPriceInfo.liquidationPrice
    const targetPrice = assetPriceInfo.targetPrice

    // Create data points for the price range
    for (let i = 0; i <= 100; i++) {
      const price = liquidationPrice * 0.8 + (currentPrice * 1.2 - liquidationPrice * 0.8) * (i / 100)
      
      // Calculate risk level based on price (simplified risk model)
      let riskLevel = 1.0
      if (price >= currentPrice) {
        riskLevel = 1.0 // Safe when price is above current
      } else if (price >= liquidationPrice) {
        riskLevel = 0.5 + 0.5 * ((price - liquidationPrice) / (currentPrice - liquidationPrice))
      } else {
        riskLevel = 0.1 // Very high risk below liquidation
      }
      
      data.push({
        price,
        riskLevel,
        liquidationThreshold: liquidationPrice,
        targetPrice: targetPrice,
        currentPrice: currentPrice,
        selectedPrice: assetPriceInfo.targetPrice
      })
    }

    return data
  }, [assetPriceInfo])

  if (loading) {
    return (
      <div className="h-64 bg-slate-800/20 rounded-lg p-4 border border-slate-600/30 flex items-center justify-center">
        <div className="text-slate-400">Loading price data...</div>
      </div>
    )
  }

  if (error || !assetPriceInfo) {
    return (
      <div className="h-64 bg-slate-800/20 rounded-lg p-4 border border-slate-600/30 flex items-center justify-center">
        <div className="text-red-400">Error: {error || 'No price data available'}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chart Title and Info */}
      <div className="text-center mb-3">
        <h3 className="text-lg font-semibold text-slate-200 mb-1">
          Price vs. Liquidation Threshold
        </h3>
        <p className="text-sm text-slate-400">
          {assetPriceInfo.symbol} Price Analysis
        </p>
      </div>



      {/* Chart - Takes remaining height */}
      <div className="flex-1 bg-slate-800/20 rounded-lg p-3 border border-slate-600/30 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            
            {/* Risk curve line */}
            <Line 
              type="monotone" 
              dataKey="riskLevel" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
            
            <XAxis 
              dataKey="price" 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              domain={['dataMin', 'dataMax']}
              ticks={[
                assetPriceInfo.liquidationPrice * 0.8,
                assetPriceInfo.liquidationPrice,
                assetPriceInfo.targetPrice,
                assetPriceInfo.currentPrice,
                assetPriceInfo.currentPrice * 1.2
              ].filter((price, index, arr) => 
                price >= assetPriceInfo.liquidationPrice * 0.8 && 
                price <= assetPriceInfo.currentPrice * 1.2
              )}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              domain={[0, 1]}
              tickFormatter={(value) => value === 1 ? 'Safe' : value === 0.5 ? 'Risk' : value === 0.1 ? 'Danger' : ''}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
              labelFormatter={(value) => `Price: $${value.toFixed(2)}`}
              formatter={(value: any, name: any) => {
                if (name === 'liquidationThreshold') return ['Liquidation', 'Liquidation Threshold']
                if (name === 'targetPrice') return ['Target', 'Target Price']
                if (name === 'currentPrice') return ['Current', 'Current Price']
                if (name === 'selectedPrice') return ['Selected', 'Selected Price']
                return [value, name]
              }}
            />
            
            {/* Liquidation threshold line */}
            <ReferenceLine
              x={assetPriceInfo.liquidationPrice}
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="5,5"
              label={{
                value: `Liq $${assetPriceInfo.liquidationPrice.toFixed(2)}`,
                position: 'top',
                fill: '#ef4444',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            
            {/* Target price line */}
            <ReferenceLine
              x={assetPriceInfo.targetPrice}
              stroke="#f59e0b"
              strokeWidth={3}
              strokeDasharray="5,5"
              label={{
                value: `Target $${assetPriceInfo.targetPrice.toFixed(2)}`,
                position: 'top',
                fill: '#f59e0b',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            
            {/* Current price line */}
            <ReferenceLine
              x={assetPriceInfo.currentPrice}
              stroke="#3b82f6"
              strokeWidth={3}
              strokeDasharray="5,5"
              label={{
                value: `$${assetPriceInfo.currentPrice.toFixed(2)} (Now)`,
                position: 'top',
                fill: '#3b82f6',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
            
            {/* Dynamic orange line that moves with the slider */}
            <ReferenceLine
              x={assetPriceInfo.currentPrice * (1 + selectedPriceChange / 100)}
              stroke="#f59e0b"
              strokeWidth={6}
              strokeDasharray="0"
              label={{
                value: `$${(assetPriceInfo.currentPrice * (1 + selectedPriceChange / 100)).toFixed(2)} (${selectedPriceChange > 0 ? '+' : ''}${selectedPriceChange}%)`,
                position: 'top',
                fill: '#f59e0b',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>




    </div>
  )
}
