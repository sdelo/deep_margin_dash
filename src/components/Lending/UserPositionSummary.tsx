import React from 'react';
import type { MarginPool } from '../../types/lending';

interface UserPositionSummaryProps {
  pool: MarginPool;
}

export function UserPositionSummary({ pool }: UserPositionSummaryProps) {
  // Mock user position data - replace with actual data fetching
  const userPosition = {
    supply_shares: '1000000000', // 1.0 shares (9 decimal precision)
    supply_index: '1050000000', // 1.05 (9 decimal precision) - from MarginPool.State.supply_index
    last_updated: Date.now() - 3600000, // 1 hour ago
    is_active: true
  };

  // Calculate actual share amount: supply_shares * supply_index
  const actualShareAmount = parseFloat(userPosition.supply_shares) * parseFloat(userPosition.supply_index) / 1e9;
  
  // Calculate interest earned: difference between actual amount and original shares
  const originalShares = parseFloat(userPosition.supply_shares) / 1e9;
  const interestEarned = actualShareAmount - originalShares;
  
  // Calculate APY based on interest earned
  const timeElapsed = (Date.now() - userPosition.last_updated) / (1000 * 60 * 60 * 24 * 365); // years
  const apy = timeElapsed > 0 ? (interestEarned / originalShares / timeElapsed) * 100 : 0;

  const formatAmount = (amount: number) => {
    return amount.toFixed(4);
  };

  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(2);
  };

  if (!userPosition.is_active) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <p className="text-gray-500 text-sm">No active position in this pool</p>
        <p className="text-gray-400 text-xs mt-2">Supply assets to start earning interest</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Position Overview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-blue-900">Active Position</h4>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-blue-600 mb-1">Original Shares</p>
            <p className="text-lg font-bold text-blue-900">{formatAmount(originalShares)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-600 mb-1">Current Value</p>
            <p className="text-lg font-bold text-blue-900">{formatAmount(actualShareAmount)}</p>
          </div>
        </div>
      </div>

      {/* Interest Earned */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <h4 className="font-semibold text-green-900 mb-3">Interest Earned</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700">Interest Amount</span>
            <span className="text-lg font-bold text-green-900">+{formatAmount(interestEarned)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700">APY</span>
            <span className="text-lg font-bold text-green-900">{formatPercentage(apy)}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700">Time Active</span>
            <span className="text-sm text-green-600">1 hour</span>
          </div>
        </div>
      </div>

      {/* Position Growth Chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Position Growth</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Growth Rate</span>
            <span className="font-medium text-gray-900">
              {((actualShareAmount / originalShares - 1) * 100).toFixed(2)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((actualShareAmount / originalShares) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Start</span>
            <span>Current</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Supply More
        </button>
        <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
          Withdraw
        </button>
      </div>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-xs text-gray-400">
          Last updated: {new Date(userPosition.last_updated).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
