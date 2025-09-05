import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MarginPool } from '../../types/lending';

interface CombinedPoolViewProps {
  selectedPools: MarginPool[];
  totalCapital: number;
  onAllocationChange: (poolId: string, allocation: number) => void;
  onBatchSupply: (allocations: Record<string, number>) => void;
  onBatchWithdraw: (allocations: Record<string, number>) => void;
  onRebalance: (strategy: 'equal' | 'risk-adjusted' | 'yield-optimized') => void;
  allocations: Record<string, number>;
  setAllocations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onPositionDataChange?: (positions: Record<string, any>) => void;
}

export function CombinedPoolView({
  selectedPools,
  totalCapital,
  onAllocationChange,
  onBatchSupply,
  onBatchWithdraw,
  onRebalance,
  allocations,
  setAllocations,
  onPositionDataChange
}: CombinedPoolViewProps) {
  
  // State for hedge options
  const [hedgeOptions, setHedgeOptions] = useState<Record<string, string>>({});

  // Mock user positions in each pool - replace with actual data fetching
  const userPositions = {
    'pool-1': { // SUI pool
      supply_shares: '3000000000', // 3.0 shares
      supply_index: '1005000000', // 1.005
      currency: 'SUI'
    },
    'pool-2': { // USDC pool  
      supply_shares: '1000000000', // 1.0 shares
      supply_index: '1003000000', // 1.003
      currency: 'USDC'
    },
    'pool-3': { // APT pool
      supply_shares: '1000000000', // 1.0 shares
      supply_index: '1002000000', // 1.002
      currency: 'APT'
    }
  };

  // Calculate current position-based allocations
  const calculatePositionBasedAllocations = () => {
    const positionValues: Record<string, number> = {};
    let totalValue = 0;
    
    selectedPools.forEach(pool => {
      const position = userPositions[pool.id as keyof typeof userPositions];
      if (position) {
        const actualValue = (parseFloat(position.supply_shares) * parseFloat(position.supply_index)) / 1e9;
        positionValues[pool.id] = actualValue;
        totalValue += actualValue;
      }
    });
    
    const allocations: Record<string, number> = {};
    selectedPools.forEach(pool => {
      if (totalValue > 0) {
        allocations[pool.id] = Math.round((positionValues[pool.id] / totalValue) * 100 * 100) / 100;
      } else {
        allocations[pool.id] = Math.round((100 / selectedPools.length) * 100) / 100;
      }
    });
    
    return allocations;
  };

  // Initialize allocations based on current positions
  useMemo(() => {
    if (selectedPools.length > 0) {
      const positionBasedAllocations = calculatePositionBasedAllocations();
      setAllocations(positionBasedAllocations);
      
      // Initialize hedge options with default "none"
      const defaultHedgeOptions: Record<string, string> = {};
      selectedPools.forEach(pool => {
        defaultHedgeOptions[pool.id] = 'none';
      });
      setHedgeOptions(defaultHedgeOptions);
    }
  }, [selectedPools, setAllocations]);

  // Notify parent component about position data changes
  useEffect(() => {
    if (onPositionDataChange && selectedPools.length > 0) {
      const positionData: Record<string, any> = {};
      selectedPools.forEach(pool => {
        const position = userPositions[pool.id as keyof typeof userPositions];
        if (position) {
          positionData[pool.id] = {
            ...position,
            pool: pool
          };
        }
      });
      console.log('CombinedPoolView - sending position data:', positionData);
      onPositionDataChange(positionData);
    }
  }, [selectedPools, onPositionDataChange]);

  const handleAllocationChange = (poolId: string, value: string) => {
    const numValue = Math.round((parseFloat(value) || 0) * 100) / 100; // Round to 2 decimal places
    
    // Calculate how much the total changed
    const currentTotal = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    const newTotal = currentTotal - (allocations[poolId] || 0) + numValue;
    const difference = newTotal - 100;
    
    // Distribute the difference proportionally among other pools
    const otherPools = selectedPools.filter(pool => pool.id !== poolId);
    const newAllocations = { ...allocations, [poolId]: numValue };
    
    if (otherPools.length > 0 && difference !== 0) {
      const totalOtherAllocation = otherPools.reduce((sum, pool) => sum + (allocations[pool.id] || 0), 0);
      
      otherPools.forEach(pool => {
        const currentAllocation = allocations[pool.id] || 0;
        const proportion = totalOtherAllocation > 0 ? currentAllocation / totalOtherAllocation : 1 / otherPools.length;
        const adjustment = -difference * proportion;
        newAllocations[pool.id] = Math.round(Math.max(0, currentAllocation + adjustment) * 100) / 100;
      });
    }
    
    setAllocations(newAllocations);
    onAllocationChange(poolId, numValue);
    
    // Show manual preview when allocations change
    setPreviewAllocations(newAllocations);
    setPreviewStrategy('manual');
  };

  const calculateCapital = (allocation: number) => {
    return (totalCapital * allocation) / 100;
  };

  const handleHedgeOptionChange = (poolId: string, option: string) => {
    setHedgeOptions(prev => ({
      ...prev,
      [poolId]: option
    }));
  };

  const getHedgeOptions = (pool: any) => {
    const isStablecoin = pool.currency_symbol === 'USDC' || pool.currency_symbol === 'USDT' || pool.currency_symbol === 'DAI';
    
    if (isStablecoin) {
      return [
        { value: 'none', label: 'None' },
        { value: 'short_perp', label: 'Hedge with Short Perp' },
        { value: 'suilend_carry', label: 'Hedge with Suilend Carry Trade' },
        { value: 'typus_put', label: 'Hedge with Typus Put' }
      ];
    } else {
      return [
        { value: 'none', label: 'None' },
        { value: 'short_perp', label: 'Hedge with Short Perp' },
        { value: 'suilend_carry', label: 'Hedge with Suilend Carry Trade' },
        { value: 'typus_put', label: 'Hedge with Typus Put' }
      ];
    }
  };

  const [previewAllocations, setPreviewAllocations] = useState<Record<string, number> | null>(null);
  const [previewStrategy, setPreviewStrategy] = useState<'equal' | 'risk-adjusted' | 'yield-optimized' | 'manual' | null>(null);

  const calculateRebalancePreview = (strategy: 'equal' | 'risk-adjusted' | 'yield-optimized') => {
    let newAllocations: Record<string, number> = {};

    switch (strategy) {
      case 'equal':
        const equalAllocation = Math.round((100 / selectedPools.length) * 100) / 100;
        selectedPools.forEach(pool => {
          newAllocations[pool.id] = equalAllocation;
        });
        break;
      case 'risk-adjusted':
        // Risk-adjusted based on utilization (lower utilization = higher allocation)
        const totalUtilization = selectedPools.reduce((sum, pool) => sum + parseFloat(pool.utilization_rate), 0);
        selectedPools.forEach(pool => {
          const riskScore = 1 - parseFloat(pool.utilization_rate);
          newAllocations[pool.id] = Math.round(((riskScore / totalUtilization) * 100) * 100) / 100;
        });
        break;
      case 'yield-optimized':
        // Yield-optimized based on current rates
        const totalRate = selectedPools.reduce((sum, pool) => sum + parseFloat(pool.current_rate || '0'), 0);
        selectedPools.forEach(pool => {
          const rate = parseFloat(pool.current_rate || '0');
          newAllocations[pool.id] = Math.round(((rate / totalRate) * 100) * 100) / 100;
        });
        break;
    }

    return newAllocations;
  };

  const handleRebalance = (strategy: 'equal' | 'risk-adjusted' | 'yield-optimized') => {
    const newAllocations = calculateRebalancePreview(strategy);
    setAllocations(newAllocations);
    onRebalance(strategy);
    // Clear preview after applying
    setPreviewAllocations(null);
    setPreviewStrategy(null);
  };

  const showRebalancePreview = (strategy: 'equal' | 'risk-adjusted' | 'yield-optimized' | 'manual') => {
    let newAllocations: Record<string, number>;
    
    if (strategy === 'manual') {
      // For manual allocations, use the current allocations as the preview
      newAllocations = { ...allocations };
    } else {
      // For strategy-based rebalancing, calculate new allocations
      newAllocations = calculateRebalancePreview(strategy);
      // Update the input boxes with the new allocations
      setAllocations(newAllocations);
    }
    
    setPreviewAllocations(newAllocations);
    setPreviewStrategy(strategy);
  };

  return (
    <Card className="h-full">
      <CardHeader title="Multi-Pool Portfolio Management" />
      <div className="space-y-4">
        {/* Pool Allocations */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Pool Allocations</h3>
          {selectedPools.map((pool) => (
            <div key={pool.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{pool.currency_symbol}</span>
                  <span className="text-sm text-gray-500">({pool.name})</span>
                </div>
                <div className="text-sm text-gray-500">
                  {pool.currency_symbol === 'SUI' ? '7.00%' : pool.currency_symbol === 'USDC' ? '5.50%' : '8.50%'} • 
                  {(parseFloat(pool.utilization_rate) * 100).toFixed(1)}% util
                </div>
              </div>
              
              {/* Current Position Info */}
              {userPositions[pool.id as keyof typeof userPositions] && (
                <div className="mb-2 p-2 bg-blue-50 rounded text-xs">
                  <span className="text-blue-700">Your Position: </span>
                  <span className="font-medium text-blue-900">
                    {((parseFloat(userPositions[pool.id as keyof typeof userPositions].supply_shares) * 
                       parseFloat(userPositions[pool.id as keyof typeof userPositions].supply_index)) / 1e9).toFixed(4)} {pool.currency_symbol}
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Allocation %</label>
                  <input
                    type="number"
                    value={allocations[pool.id] || 0}
                    onChange={(e) => handleAllocationChange(pool.id, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Capital</label>
                  <div className="px-2 py-1 text-sm bg-gray-100 rounded text-gray-700">
                    ${calculateCapital(allocations[pool.id] || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Hedging Options */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hedging Strategy</label>
                <select
                  value={hedgeOptions[pool.id] || 'none'}
                  onChange={(e) => handleHedgeOptionChange(pool.id, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {getHedgeOptions(pool).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Portfolio Actions Footer */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`text-sm ${Math.abs(Object.values(allocations).reduce((sum, val) => sum + val, 0) - 100) < 0.1 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {Object.values(allocations).reduce((sum, val) => sum + val, 0).toFixed(1)}%
              {Math.abs(Object.values(allocations).reduce((sum, val) => sum + val, 0) - 100) >= 0.1 && (
                <span className="ml-1 text-xs">(Must equal 100%)</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const currentPositions = calculatePositionBasedAllocations();
                  setAllocations(currentPositions);
                  setPreviewAllocations(currentPositions);
                  setPreviewStrategy('manual');
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                Current
              </button>
              <button
                onClick={() => showRebalancePreview('equal')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  previewStrategy === 'equal' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Equal
              </button>
              <button
                onClick={() => showRebalancePreview('risk-adjusted')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  previewStrategy === 'risk-adjusted' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Risk
              </button>
              <button
                onClick={() => showRebalancePreview('yield-optimized')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  previewStrategy === 'yield-optimized' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-blue-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                Yield
              </button>
            </div>
          </div>
          
          {/* Rebalance Button */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                if (previewStrategy === 'manual') {
                  // For manual allocations, just clear the preview since allocations are already applied
                  setPreviewAllocations(null);
                  setPreviewStrategy(null);
                } else {
                  // For strategy-based rebalancing, apply the changes
                  handleRebalance(previewStrategy as 'equal' | 'risk-adjusted' | 'yield-optimized');
                }
              }}
              disabled={!previewAllocations}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                previewAllocations 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              🔄 {previewStrategy === 'manual' ? 'Clear Preview' : `Apply ${previewStrategy ? previewStrategy.charAt(0).toUpperCase() + previewStrategy.slice(1) : 'Rebalance'}`}
            </button>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {previewAllocations ? 'Click to apply the preview above' : 'Select a strategy above to see preview'}
            </p>
          </div>

          {/* Rebalance Preview */}
          {previewAllocations && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                📊 {previewStrategy === 'manual' ? 'Manual Allocation Preview' : `${previewStrategy ? previewStrategy.charAt(0).toUpperCase() + previewStrategy.slice(1) : ''} Strategy Preview`}
              </h4>
              <div className="space-y-2">
                {selectedPools.map((pool) => {
                  const currentAllocation = allocations[pool.id] || 0;
                  const newAllocation = previewAllocations[pool.id] || 0;
                  const change = newAllocation - currentAllocation;
                  const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
                  const changeIcon = change > 0 ? '↗' : change < 0 ? '↘' : '→';
                  
                  return (
                    <div key={pool.id} className="flex justify-between items-center text-sm">
                      <span className="text-blue-800 font-medium">{pool.currency_symbol}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">
                          {currentAllocation.toFixed(1)}% → {newAllocation.toFixed(1)}%
                        </span>
                        <span className={`${changeColor} font-medium`}>
                          {changeIcon} {Math.abs(change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex justify-between text-xs text-blue-700">
                  <span>Total Change:</span>
                  <span className="font-medium">
                    {Object.values(previewAllocations).reduce((sum, val) => sum + val, 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
