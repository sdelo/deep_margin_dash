import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { DeepBookPool, PoolConfig } from '../../types/lending';

interface DeepBookPoolsSectionProps {
  poolId: string;
}

export function DeepBookPoolsSection({ poolId }: DeepBookPoolsSectionProps) {
  // Mock data - replace with actual data fetching based on poolId
  const linkedDeepBookPools: DeepBookPool[] = [
    {
      id: 'deepbook-pool-1',
      pool_config: {
        base_margin_pool_id: poolId,
        quote_margin_pool_id: 'pool-2',
        risk_ratios: {
          min_withdraw_risk_ratio: '2000000000', // 2.0x
          min_borrow_risk_ratio: '1500000000',   // 1.5x
          liquidation_risk_ratio: '1200000000',  // 1.2x
          target_liquidation_risk_ratio: '1300000000' // 1.3x
        },
        user_liquidation_reward: '50000000', // 5%
        pool_liquidation_reward: '10000000', // 1%
        enabled: true
      },
      base_asset_type: '0x2::sui::SUI',
      quote_asset_type: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::USDC',
      created_at: Date.now() - 86400000, // 1 day ago
      last_updated: Date.now()
    },
    {
      id: 'deepbook-pool-2',
      pool_config: {
        base_margin_pool_id: poolId,
        quote_margin_pool_id: 'pool-3',
        risk_ratios: {
          min_withdraw_risk_ratio: '1800000000', // 1.8x
          min_borrow_risk_ratio: '1400000000',   // 1.4x
          liquidation_risk_ratio: '1150000000',  // 1.15x
          target_liquidation_risk_ratio: '1250000000' // 1.25x
        },
        user_liquidation_reward: '40000000', // 4%
        pool_liquidation_reward: '8000000', // 0.8%
        enabled: true
      },
      base_asset_type: '0x2::sui::SUI',
      quote_asset_type: '0x1::aptos_coin::AptosCoin',
      created_at: Date.now() - 172800000, // 2 days ago
      last_updated: Date.now()
    }
  ];

  const formatRiskRatio = (ratio: string) => {
    const num = parseFloat(ratio) / 1e9;
    return `${num.toFixed(2)}x`;
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value) / 1e9 * 100;
    return `${num.toFixed(1)}%`;
  };

  const getAssetSymbol = (assetType: string) => {
    if (assetType.includes('SUI')) return 'SUI';
    if (assetType.includes('USDC')) return 'USDC';
    if (assetType.includes('AptosCoin')) return 'APT';
    return assetType.split('::').pop() || 'Unknown';
  };

  return (
    <Card>
      <CardHeader 
        title="Linked DeepBook Pools" 
        subtitle="Pools connected to this margin pool for trading"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {linkedDeepBookPools.map((pool) => (
          <div key={pool.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">
                  {getAssetSymbol(pool.base_asset_type)} / {getAssetSymbol(pool.quote_asset_type)}
                </h4>
                <p className="text-sm text-gray-500">Pool ID: {pool.id.slice(0, 8)}...</p>
              </div>
              <Badge tone={pool.pool_config.enabled ? "positive" : "neutral"}>
                {pool.pool_config.enabled ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Min Withdraw Ratio</p>
                  <p className="font-medium text-gray-900">
                    {formatRiskRatio(pool.pool_config.risk_ratios.min_withdraw_risk_ratio)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Min Borrow Ratio</p>
                  <p className="font-medium text-gray-900">
                    {formatRiskRatio(pool.pool_config.risk_ratios.min_borrow_risk_ratio)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Liquidation Ratio</p>
                  <p className="font-medium text-gray-900">
                    {formatRiskRatio(pool.pool_config.risk_ratios.liquidation_risk_ratio)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Target Liquidation</p>
                  <p className="font-medium text-gray-900">
                    {formatRiskRatio(pool.pool_config.risk_ratios.target_liquidation_risk_ratio)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">User Reward</span>
                  <span className="font-medium text-green-600">
                    {formatPercentage(pool.pool_config.user_liquidation_reward)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pool Reward</span>
                  <span className="font-medium text-blue-600">
                    {formatPercentage(pool.pool_config.pool_liquidation_reward)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
