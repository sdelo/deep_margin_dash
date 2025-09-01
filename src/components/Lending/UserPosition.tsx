import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MarginPool } from '../../types/lending';

interface UserPositionProps {
  pool: MarginPool;
}

export function UserPosition({ pool }: UserPositionProps) {
  // Mock user position data - replace with actual data fetching
  const userPosition = {
    supply_shares: '500000000', // 0.5 SUI equivalent
    supplied_amount: '500000000', // 0.5 SUI
    earned_interest: '25000000', // 0.025 SUI
    apy: '0.07', // 7%
    last_updated: Date.now() - 3600000, // 1 hour ago
    is_active: true
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount) / 1e9;
    return `${num.toFixed(6)}`;
  };

  const formatUSD = (amount: string) => {
    // Mock USD conversion - replace with actual price data
    const num = parseFloat(amount) / 1e9 * 1.5; // Assuming 1 SUI = $1.50
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (rate: string) => {
    const percentage = parseFloat(rate) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!userPosition.is_active) {
    return (
      <Card>
        <CardHeader title="Your Position" />
        <div className="text-center py-6">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-600 mb-2">No active position</p>
          <p className="text-sm text-gray-500">
            Supply assets to start earning interest
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Your Position" />
      
      {/* Position Status */}
      <div className="flex items-center justify-between mb-4">
        <Badge tone="positive">Active</Badge>
        <span className="text-xs text-gray-500">
          Updated {formatTimestamp(userPosition.last_updated)}
        </span>
      </div>

      {/* Main Position Stats */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Supply Shares</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatAmount(userPosition.supply_shares)}
            </p>
            <p className="text-xs text-gray-500">
              ≈ {formatUSD(userPosition.supply_shares)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Supplied Amount</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatAmount(userPosition.supplied_amount)} {pool.currency_symbol}
            </p>
            <p className="text-xs text-gray-500">
              ≈ {formatUSD(userPosition.supplied_amount)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Earned Interest</p>
            <p className="text-lg font-semibold text-green-600">
              {formatAmount(userPosition.earned_interest)} {pool.currency_symbol}
            </p>
            <p className="text-xs text-gray-500">
              ≈ {formatUSD(userPosition.earned_interest)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current APY</p>
            <p className="text-lg font-semibold text-blue-600">
              {formatPercentage(userPosition.apy)}
            </p>
            <p className="text-xs text-gray-500">
              Variable rate
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar for Position Growth */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Initial Investment</span>
          <span>Total Value</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(parseFloat(userPosition.supplied_amount) + parseFloat(userPosition.earned_interest)) / parseFloat(userPosition.supplied_amount) * 100}%` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatAmount(userPosition.supplied_amount)}</span>
          <span>{formatAmount((parseFloat(userPosition.supplied_amount) + parseFloat(userPosition.earned_interest)).toString())}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
            Add More
          </button>
          <button className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
            View History
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Position Details:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Interest compounds continuously</li>
          <li>• Withdraw anytime (subject to pool limits)</li>
          <li>• Rates adjust based on pool utilization</li>
          <li>• No lock-up period required</li>
        </ul>
      </div>
    </Card>
  );
}
