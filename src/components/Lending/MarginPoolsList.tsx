import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MarginPool } from '../../types/lending';

interface MarginPoolsListProps {
  onPoolSelect: (pool: MarginPool) => void;
  selectedPool: MarginPool | null;
  compact?: boolean;
}

export function MarginPoolsList({ onPoolSelect, selectedPool, compact = false }: MarginPoolsListProps) {
  // Mock data - replace with actual data fetching
  const marginPools: MarginPool[] = [
    {
      id: 'pool-1',
      asset_type: '0x2::sui::SUI',
      total_supply: '1000000000000',
      total_borrow: '500000000000',
      utilization_rate: '0.5',
      base_rate: '0.02',
      base_slope: '0.1',
      optimal_utilization: '0.8',
      excess_slope: '0.5',
      last_index_update_timestamp: Date.now(),
      current_rate: '0.07',
      daily_interest_cost_usd: '3500',
      weekly_interest_cost_usd: '24500',
      supply_cap: '2000000000000',
      protocol_spread: '0.1',
      protocol_profit: '50000000000',
      vault_value: '1000000000000',
      unique_positions: 25,
      allowed_deepbook_pools: ['deepbook-pool-1', 'deepbook-pool-2'],
      name: 'SUI Margin Pool',
      currency_symbol: 'SUI'
    },
    {
      id: 'pool-2',
      asset_type: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::USDC',
      total_supply: '50000000000',
      total_borrow: '30000000000',
      utilization_rate: '0.6',
      base_rate: '0.015',
      base_slope: '0.08',
      optimal_utilization: '0.75',
      excess_slope: '0.4',
      last_index_update_timestamp: Date.now(),
      current_rate: '0.055',
      daily_interest_cost_usd: '1650',
      weekly_interest_cost_usd: '11550',
      supply_cap: '100000000000',
      protocol_spread: '0.08',
      protocol_profit: '2400000000',
      vault_value: '50000000000',
      unique_positions: 18,
      allowed_deepbook_pools: ['deepbook-pool-3'],
      name: 'USDC Margin Pool',
      currency_symbol: 'USDC'
    }
  ];

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

  if (compact) {
    // Compact sidebar view
    return (
      <div className="space-y-1">
        {marginPools.map((pool) => (
          <div
            key={pool.id}
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              selectedPool?.id === pool.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onPoolSelect(pool)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Crypto Icon */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {pool.currency_symbol === 'SUI' ? 'S' : pool.currency_symbol === 'USDC' ? 'U' : 'C'}
                </div>
                <span className="font-medium text-xs text-gray-900">{pool.currency_symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-green-600">
                  {formatInterestRate(pool.current_rate || '0')}
                </div>
                <div className="text-xs text-gray-500">
                  {formatUtilizationRate(pool.utilization_rate)} util
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
      <CardHeader 
        title="Margin Pools" 
        subtitle="Available lending pools and their current status"
      />
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Pool</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">DeepBook Pools</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Utilization</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Interest Rate</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Supply Cap</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Total Supply</th>
            </tr>
          </thead>
          <tbody>
            {marginPools.map((pool) => (
              <tr 
                key={pool.id}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedPool?.id === pool.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onPoolSelect(pool)}
              >
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{pool.name}</div>
                    <div className="text-sm text-gray-500">{pool.currency_symbol}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1">
                    {pool.allowed_deepbook_pools.map((deepbookPool, index) => (
                      <Badge key={index} tone="info" className="text-xs">
                        {deepbookPool.slice(0, 8)}...
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-4">
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
                <td className="py-4 px-4">
                  <span className="font-medium text-green-600">
                    {formatInterestRate(pool.current_rate || '0')}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-medium text-gray-900">
                    {formatLargeNumber(pool.supply_cap)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-medium text-gray-900">
                    {formatLargeNumber(pool.total_supply)}
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
