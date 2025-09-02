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

        {/* Pool List */}
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

  // Full table view
  return (
    <Card>
      <CardHeader title="Margin Pools" />
      
      {/* Selection Controls */}
      {showCheckboxes && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} pool{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {showCheckboxes && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedCount === pools.length && pools.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectAll();
                      } else {
                        onClearAll();
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pool
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DeepBook Pools
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Supply
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pools.map((pool) => (
              <tr 
                key={pool.id}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  isPoolSelected(pool) ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onPoolSelect(pool)}
              >
                {showCheckboxes && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isPoolSelected(pool)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onPoolToggle(pool, e.target.checked);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </td>
                )}
                <td className="py-4 px-6">
                  <div>
                    <div className="font-medium text-gray-900">{pool.name}</div>
                    <div className="text-sm text-gray-500">{pool.currency_symbol}</div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    {pool.allowed_deepbook_pools.map((deepbookPool, index) => (
                      <Badge key={index} tone="info" className="text-xs">
                        {deepbookPool.slice(0, 8)}...
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {formatUtilizationRate(pool.utilization_rate)}
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${parseFloat(pool.utilization_rate) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="font-medium text-green-600">
                    {formatInterestRate(pool.current_rate || '0')}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="font-medium text-gray-900">
                    {formatLargeNumber(pool.total_supply)} {pool.currency_symbol}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
