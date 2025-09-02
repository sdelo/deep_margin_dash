import React, { useState, useMemo } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MarginPool } from '../../types/lending';

interface CombinedPoolViewProps {
  selectedPools: MarginPool[];
  onAllocationChange: (poolId: string, allocation: number) => void;
  onBatchSupply: (allocations: Record<string, number>) => void;
  onBatchWithdraw: (allocations: Record<string, number>) => void;
  onRebalance: (strategy: 'equal' | 'risk-adjusted' | 'yield-optimized' | 'custom') => void;
}

interface PoolAllocation {
  poolId: string;
  allocation: number;
  pool: MarginPool;
}

export function CombinedPoolView({ 
  selectedPools, 
  onAllocationChange, 
  onBatchSupply, 
  onBatchWithdraw,
  onRebalance 
}: CombinedPoolViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'allocate' | 'rebalance'>('overview');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [totalAmount, setTotalAmount] = useState<string>('1000');

  // Initialize allocations if not set
  React.useEffect(() => {
    if (selectedPools.length > 0 && Object.keys(allocations).length === 0) {
      const equalAllocation = 100 / selectedPools.length;
      const initialAllocations: Record<string, number> = {};
      selectedPools.forEach(pool => {
        initialAllocations[pool.id] = equalAllocation;
      });
      setAllocations(initialAllocations);
    }
  }, [selectedPools, allocations]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (selectedPools.length === 0) return null;

    const totalSupply = selectedPools.reduce((sum, pool) => 
      sum + parseFloat(pool.total_supply), 0
    );
    
    const weightedRate = selectedPools.reduce((sum, pool) => 
      sum + (parseFloat(pool.current_rate || '0') * parseFloat(pool.total_supply)), 0
    ) / totalSupply;

    const weightedUtilization = selectedPools.reduce((sum, pool) => 
      sum + (parseFloat(pool.utilization_rate) * parseFloat(pool.total_supply)), 0
    ) / totalSupply;

    const totalPositions = selectedPools.reduce((sum, pool) => 
      sum + pool.unique_positions, 0
    );

    return {
      totalSupply,
      weightedRate,
      weightedUtilization,
      totalPositions,
      poolCount: selectedPools.length
    };
  }, [selectedPools]);

  // Rebalancing strategies
  const applyRebalancingStrategy = (strategy: 'equal' | 'risk-adjusted' | 'yield-optimized' | 'custom') => {
    let newAllocations: Record<string, number> = {};

    switch (strategy) {
      case 'equal':
        const equalAllocation = 100 / selectedPools.length;
        selectedPools.forEach(pool => {
          newAllocations[pool.id] = equalAllocation;
        });
        break;

      case 'risk-adjusted':
        // Weight by inverse of utilization (lower utilization = higher allocation)
        const totalRiskScore = selectedPools.reduce((sum, pool) => 
          sum + (1 - parseFloat(pool.utilization_rate)), 0
        );
        selectedPools.forEach(pool => {
          const riskScore = 1 - parseFloat(pool.utilization_rate);
          newAllocations[pool.id] = (riskScore / totalRiskScore) * 100;
        });
        break;

      case 'yield-optimized':
        // Weight by current rates
        const totalYield = selectedPools.reduce((sum, pool) => 
          sum + parseFloat(pool.current_rate || '0'), 0
        );
        selectedPools.forEach(pool => {
          const rate = parseFloat(pool.current_rate || '0');
          newAllocations[pool.id] = (rate / totalYield) * 100;
        });
        break;

      case 'custom':
        // Keep current allocations
        newAllocations = { ...allocations };
        break;
    }

    setAllocations(newAllocations);
    onRebalance(strategy);
  };

  const handleAllocationChange = (poolId: string, value: number) => {
    const newAllocations = { ...allocations };
    newAllocations[poolId] = Math.max(0, Math.min(100, value));
    
    // Normalize to ensure total equals 100%
    const total = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      Object.keys(newAllocations).forEach(id => {
        newAllocations[id] = (newAllocations[id] / total) * 100;
      });
    }
    
    setAllocations(newAllocations);
    onAllocationChange(poolId, newAllocations[poolId]);
  };

  const handleBatchSupply = () => {
    onBatchSupply(allocations);
  };

  const handleBatchWithdraw = () => {
    onBatchWithdraw(allocations);
  };

  if (selectedPools.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select multiple pools to view combined analysis
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader title="Portfolio Overview" />
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{portfolioMetrics?.poolCount}</div>
              <div className="text-sm text-gray-500">Pools Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(portfolioMetrics?.weightedRate * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500">Weighted Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(portfolioMetrics?.weightedUtilization * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Avg Utilization</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(portfolioMetrics?.totalSupply / 1e9).toFixed(1)}B
              </div>
              <div className="text-sm text-gray-500">Total Supply</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('allocate')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'allocate'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Allocate
        </button>
        <button
          onClick={() => setActiveTab('rebalance')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'rebalance'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Rebalance
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pool Details */}
          <Card>
            <CardHeader title="Selected Pools" />
            <div className="p-4">
              <div className="space-y-3">
                {selectedPools.map((pool) => (
                  <div key={pool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{pool.name}</div>
                      <div className="text-sm text-gray-500">{pool.currency_symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {(parseFloat(pool.current_rate || '0') * 100).toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {(parseFloat(pool.utilization_rate) * 100).toFixed(1)}% util
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div className="p-4 space-y-3">
              <button
                onClick={() => setActiveTab('allocate')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Allocations
              </button>
              <button
                onClick={() => setActiveTab('rebalance')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Rebalance Portfolio
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'allocate' && (
        <div className="space-y-6">
          {/* Allocation Input */}
          <Card>
            <CardHeader title="Portfolio Allocation" />
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount to Allocate
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-4">
                {selectedPools.map((pool) => (
                  <div key={pool.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{pool.name}</span>
                        <span className="text-sm text-gray-500">
                          {allocations[pool.id]?.toFixed(1) || '0'}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={allocations[pool.id] || 0}
                        onChange={(e) => handleAllocationChange(pool.id, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleBatchSupply}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Supply to All Pools
                </button>
                <button
                  onClick={handleBatchWithdraw}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Withdraw from All Pools
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'rebalance' && (
        <div className="space-y-6">
          {/* Rebalancing Strategies */}
          <Card>
            <CardHeader title="Rebalancing Strategies" />
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => applyRebalancingStrategy('equal')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">Equal Weight</div>
                  <div className="text-sm text-gray-500">Distribute evenly across all pools</div>
                </button>

                <button
                  onClick={() => applyRebalancingStrategy('risk-adjusted')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">Risk-Adjusted</div>
                  <div className="text-sm text-gray-500">Weight by pool risk/volatility</div>
                </button>

                <button
                  onClick={() => applyRebalancingStrategy('yield-optimized')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">Yield-Optimized</div>
                  <div className="text-sm text-gray-500">Weight by current interest rates</div>
                </button>

                <button
                  onClick={() => applyRebalancingStrategy('custom')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">Custom</div>
                  <div className="text-sm text-gray-500">Use your current allocations</div>
                </button>
              </div>

              {/* Current Allocations Display */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Current Allocations</h4>
                <div className="space-y-2">
                  {selectedPools.map((pool) => (
                    <div key={pool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{pool.name}</span>
                      <span className="text-sm text-gray-500">
                        {allocations[pool.id]?.toFixed(1) || '0'}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
