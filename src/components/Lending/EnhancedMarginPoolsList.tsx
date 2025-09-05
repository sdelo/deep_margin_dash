import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MarginPool } from '../../types/lending';

interface EnhancedMarginPoolsListProps {
  pools: MarginPool[];
  selectedPools: MarginPool[];
  onPoolSelect: (pool: MarginPool) => void;
  onPoolToggle: (pool: MarginPool, isSelected: boolean) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  compact?: boolean;
  showCheckboxes?: boolean;
}

export function EnhancedMarginPoolsList({ 
  pools, 
  selectedPools, 
  onPoolSelect, 
  onPoolToggle,
  onSelectAll,
  onClearAll,
  compact = false,
  showCheckboxes = false
}: EnhancedMarginPoolsListProps) {
  const formatUtilizationRate = (rate: string) => {
    const percentage = parseFloat(rate) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  const formatInterestRate = (rate: string) => {
    const percentage = parseFloat(rate) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  const formatLargeNumber = (value: string) => {
    const num = parseFloat(value) / 1e9;
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}B`;
    }
    return `${num.toFixed(1)}M`;
  };

  const formatUSD = (value: string) => {
    const num = parseFloat(value) / 1e9;
    return `$${num.toFixed(2)}`;
  };

  const isPoolSelected = (pool: MarginPool) => {
    return selectedPools.some(selected => selected.id === pool.id);
  };

  const selectedCount = selectedPools.length;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Selection Controls */}
        {showCheckboxes && (
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-md">
            <span className="text-xs text-gray-600">
              {selectedCount} pool{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-1">
              <button
                onClick={onSelectAll}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                All
              </button>
              <button
                onClick={onClearAll}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Pool Cards */}
        {pools.map((pool) => (
          <div
            key={pool.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              isPoolSelected(pool)
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => onPoolSelect(pool)}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              {showCheckboxes && (
                <input
                  type="checkbox"
                  checked={isPoolSelected(pool)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onPoolToggle(pool, e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              )}

              {/* Pool Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-gray-900 truncate">{pool.name}</div>
                  <span className="text-sm text-green-600 font-semibold">
                    {formatInterestRate(pool.current_rate || '0')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{pool.currency_symbol}</span>
                  <span>{formatUtilizationRate(pool.utilization_rate)} util</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Full cards view (replaces table) - NO MULTISELECT on list page
  return (
    <div className="space-y-6">
      {/* Pool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="bg-white rounded-lg border-2 border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-lg"
            onClick={() => onPoolSelect(pool)}
          >
            {/* Pool Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{pool.name}</h3>
                  <p className="text-sm text-gray-500">{pool.currency_symbol}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatInterestRate(pool.current_rate || '0')}
                  </div>
                  <div className="text-sm text-gray-500">Current Rate</div>
                </div>
              </div>
            </div>

            {/* Pool Metrics */}
            <div className="p-4">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Utilization</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatUtilizationRate(pool.utilization_rate)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${parseFloat(pool.utilization_rate) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Supply</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatLargeNumber(pool.total_supply)} {pool.currency_symbol}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unique Positions</p>
                  <p className="text-lg font-semibold text-gray-900">{pool.unique_positions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Protocol Spread</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(parseFloat(pool.protocol_spread) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Additional Rich Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-600">Protocol Profit</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatUSD(pool.protocol_profit)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">Vault Value</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatUSD(pool.vault_value)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-600">Daily Interest Cost</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {formatUSD(pool.daily_interest_cost_usd)}
                  </span>
                </div>
              </div>

              {/* DeepBook Pools Count */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Linked DeepBook Pools</span>
                <Badge tone="info" className="text-sm">
                  {pool.allowed_deepbook_pools.length} pools
                </Badge>
              </div>

              {/* Risk Indicators */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">Risk Profile</span>
                  <span className="text-xs text-yellow-600">
                    {parseFloat(pool.utilization_rate) > 0.8 ? 'High' : 
                     parseFloat(pool.utilization_rate) > 0.6 ? 'Medium' : 'Low'}
                  </span>
                </div>
                <div className="text-xs text-yellow-700">
                  {parseFloat(pool.utilization_rate) > 0.8 
                    ? 'High utilization - consider supply limits'
                    : parseFloat(pool.utilization_rate) > 0.6
                    ? 'Moderate utilization - good supply opportunity'
                    : 'Low utilization - stable rates expected'
                  }
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
