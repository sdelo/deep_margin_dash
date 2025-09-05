import React from 'react';
import type { MarginPool } from '../../types/lending';

interface UserPositionSummaryProps {
  pool: MarginPool;
  positionData?: Record<string, {
    supply_shares: string;
    supply_index: string;
    currency: string;
    pool: MarginPool;
  }>;
}

export function UserPositionSummary({ pool, positionData }: UserPositionSummaryProps) {
  // Debug logging
  console.log('UserPositionSummary - pool:', pool.id, 'positionData:', positionData);
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(2) + 'M';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(2) + 'K';
    } else {
      return amount.toFixed(4);
    }
  };

  const formatPercentage = (percentage: number) => {
    if (percentage >= 1000000) {
      return (percentage / 1000000).toFixed(2) + 'M%';
    } else if (percentage >= 1000) {
      return (percentage / 1000).toFixed(2) + 'K%';
    } else {
      return percentage.toFixed(2) + '%';
    }
  };

  // If no position data, show empty state
  if (!positionData || Object.keys(positionData).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <p className="text-gray-500 text-sm">No active positions</p>
        <p className="text-gray-400 text-xs mt-2">Supply assets to start earning interest</p>
      </div>
    );
  }

  // Calculate total portfolio value
  let totalValue = 0;
  const positions = Object.values(positionData).map(pos => {
    const actualValue = (parseFloat(pos.supply_shares) * parseFloat(pos.supply_index)) / 1e9;
    const originalShares = parseFloat(pos.supply_shares) / 1e9;
    const interestEarned = actualValue - originalShares;
    const timeElapsedHours = 1; // Mock 1 hour
    const apy = (interestEarned / originalShares / (timeElapsedHours / 24)) * 365 * 100;
    
    totalValue += actualValue;
    
    return {
      ...pos,
      actualValue,
      originalShares,
      interestEarned,
      apy
    };
  });

  return (
    <div className="space-y-4">
      {/* All Positions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">All Positions</h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {positions.map((position, index) => (
            <div key={position.pool.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{position.currency}</span>
                  <span className="text-sm text-gray-500">({position.pool.name})</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-500">
                  {position.currency === 'SUI' ? '7.00%' : position.currency === 'USDC' ? '5.50%' : '8.50%'} APY
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Original Shares</p>
                  <p className="font-medium text-gray-900">{formatAmount(position.originalShares)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Current Value</p>
                  <p className="font-medium text-gray-900">{formatAmount(position.actualValue)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Interest Earned</p>
                  <p className="font-medium text-green-600">+{formatAmount(position.interestEarned)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">APY</p>
                  <p className="font-medium text-green-600">{formatPercentage(position.apy)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">Portfolio Summary</h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-600 text-xs mb-1">Total Value</p>
            <p className="text-lg font-bold text-blue-900">{formatAmount(totalValue)}</p>
          </div>
          <div>
            <p className="text-blue-600 text-xs mb-1">Active Pools</p>
            <p className="text-lg font-bold text-blue-900">{positions.length}</p>
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
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

