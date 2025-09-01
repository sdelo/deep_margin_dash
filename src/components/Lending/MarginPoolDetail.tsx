import React, { useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DeepBookPoolsSection } from './DeepBookPoolsSection';
import { MarginPoolEvents } from './MarginPoolEvents';
import { SupplyWithdrawForm } from './SupplyWithdrawForm';
import { UserPosition } from './UserPosition';
import { UserEventsTimeline } from './UserEventsTimeline';
import type { MarginPool } from '../../types/lending';

interface MarginPoolDetailProps {
  pool: MarginPool;
}

export function MarginPoolDetail({ pool }: MarginPoolDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions'>('overview');

  const formatUtilizationRate = (rate: string) => {
    const percentage = parseFloat(rate) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  const formatInterestRate = (rate: string) => {
    const percentage = parseFloat(rate) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  const formatLargeNumber = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatUSD = (value: string) => {
    const num = parseFloat(value);
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Pool Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{pool.name}</h2>
            <p className="text-gray-600">{pool.currency_symbol}</p>
          </div>
          <Badge tone="positive" className="text-sm">
            Active
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Current Rate</p>
            <p className="text-lg font-semibold text-green-600">
              {formatInterestRate(pool.current_rate || '0')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Utilization</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatUtilizationRate(pool.utilization_rate)}
            </p>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'actions'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Actions
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Main Pool Information */}
          <Card>
            <CardHeader title="Pool Information" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Max Supply Cap</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatLargeNumber(pool.supply_cap)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount Supplied</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatLargeNumber(pool.total_supply)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount Borrowed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatLargeNumber(pool.total_borrow)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unique Positions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {pool.unique_positions}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Protocol Spread</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatInterestRate(pool.protocol_spread)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Protocol Profit</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatUSD(pool.protocol_profit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vault Value</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatUSD(pool.vault_value)}
                </p>
              </div>
            </div>
          </Card>

          {/* Utilization Curve Diagram */}
          <Card>
            <CardHeader title="Utilization Curve" />
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Base Rate: {formatInterestRate(pool.base_rate)}</span>
                <span>Optimal: {formatUtilizationRate(pool.optimal_utilization)}</span>
                <span>Max: 100%</span>
              </div>
              <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                {/* Simplified utilization curve visualization */}
                <div className="absolute inset-0 flex items-end">
                  <div className="w-full h-full bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 opacity-60" />
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-300" />
                <div 
                  className="absolute bottom-0 h-full w-1 bg-blue-600"
                  style={{ left: `${parseFloat(pool.utilization_rate) * 100}%` }}
                />
              </div>
              <div className="text-center text-sm text-gray-600">
                Current utilization: {formatUtilizationRate(pool.utilization_rate)}
              </div>
            </div>
          </Card>

          {/* DeepBook Pools Section */}
          <DeepBookPoolsSection poolId={pool.id} />

          {/* Margin Pool Events */}
          <MarginPoolEvents poolId={pool.id} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Supply/Withdraw Form */}
          <SupplyWithdrawForm pool={pool} />

          {/* User Position */}
          <UserPosition pool={pool} />

          {/* User Events Timeline */}
          <UserEventsTimeline pool={pool} />
        </div>
      )}
    </div>
  );
}
