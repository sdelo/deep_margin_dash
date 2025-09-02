import React, { useState } from 'react';
import { MarginPoolsList } from './MarginPoolsList';
import { DeepBookPoolsSection } from './DeepBookPoolsSection';
import { MarginPoolEvents } from './MarginPoolEvents';
import { SupplyWithdrawForm } from './SupplyWithdrawForm';
import { UserPositionSummary } from './UserPositionSummary';
import { UserEventsTimeline } from './UserEventsTimeline';
import { UtilizationCurve } from './UtilizationCurve';
import type { MarginPool } from '../../types/lending';

export function LendingPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('detail');
  const [selectedPool, setSelectedPool] = useState<MarginPool | null>(null);

  // Auto-select first pool if none selected
  React.useEffect(() => {
    if (!selectedPool && activeTab === 'detail') {
      // Mock data - replace with actual data fetching
      const firstPool: MarginPool = {
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
      };
      setSelectedPool(firstPool);
    }
  }, [selectedPool, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'detail'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Detail
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        /* List View - Full width table */
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Margin Pools</h1>
            <MarginPoolsList 
              onPoolSelect={(pool) => {
                setSelectedPool(pool);
                setActiveTab('detail');
              }} 
              selectedPool={selectedPool} 
            />
          </div>
        </div>
      ) : (
        /* Detail View - Three column layout */
        <div className="flex h-[calc(100vh-120px)]">
          {/* Left Sidebar - Margin Pools List */}
          <div className="w-56 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-3">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Margin Pools</h3>
              
              {/* Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search pools..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <MarginPoolsList 
                onPoolSelect={setSelectedPool} 
                selectedPool={selectedPool}
                compact={true}
              />
            </div>
          </div>

          {/* Central Content Area */}
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            <div className="px-4 py-6 h-full flex flex-col">
              {/* Top Row: Margin Pool Details + Supply/Withdraw side by side */}
              <div className="flex gap-6 mb-2" style={{ height: '40%' }}>
                {/* Margin Pool Details - Left side (60%) */}
                <div className="w-3/5 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Margin Pool Details</h2>
                  {selectedPool ? (
                    <div className="space-y-4">
                      {/* Pool Info and Interest Rate Curve side by side */}
                      <div className="flex gap-4">
                        {/* Left side - Pool Metrics */}
                        <div className="flex-1">
                          {/* Basic Pool Info */}
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <p className="text-sm text-gray-500">Pool Name</p>
                              <p className="text-lg font-semibold text-gray-900">{selectedPool.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Current Rate</p>
                              <p className="text-lg font-semibold text-green-600">
                                {(parseFloat(selectedPool.current_rate || '0') * 100).toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Utilization</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {(parseFloat(selectedPool.utilization_rate) * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Total Supply</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {(parseFloat(selectedPool.total_supply) / 1e9).toFixed(2)} {selectedPool.currency_symbol}
                              </p>
                            </div>
                          </div>

                          {/* Additional Pool Metrics */}
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <p className="text-sm text-gray-500">Unique Positions</p>
                              <p className="text-lg font-semibold text-gray-900">{selectedPool.unique_positions}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Protocol Spread</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {(parseFloat(selectedPool.protocol_spread) * 100).toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Protocol Profit</p>
                              <p className="text-lg font-semibold text-gray-900">
                                ${(parseFloat(selectedPool.protocol_profit) / 1e9).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Vault Value</p>
                              <p className="text-lg font-semibold text-gray-900">
                                ${(parseFloat(selectedPool.vault_value) / 1e9).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Interest Rate Curve */}
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">Interest Rate Curve</h3>
                          <UtilizationCurve pool={selectedPool} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Select a pool to view details</p>
                  )}
                </div>

                {/* Supply/Withdraw Section - Right side (larger) */}
                <div className="flex-1 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Supply / Withdraw</h2>
                  {selectedPool && (
                    <SupplyWithdrawForm pool={selectedPool} />
                  )}
                </div>
              </div>

              {/* Pools Linked to Margin Pool - 15% height */}
              <div className="bg-white rounded-lg shadow-sm p-3 mb-2 flex-shrink-0 overflow-y-auto" style={{ height: '15%' }}>
                <h2 className="text-sm font-bold text-gray-900 mb-2">Linked DeepBook Pools</h2>
                {selectedPool && (
                  <DeepBookPoolsSection poolId={selectedPool.id} />
                )}
              </div>

              {/* All Margin Pool Events - remaining height */}
              <div className="bg-white rounded-lg shadow-sm p-3 flex-1">
                <h2 className="text-sm font-bold text-gray-900 mb-2">Margin Pool Events</h2>
                {selectedPool && (
                  <MarginPoolEvents poolId={selectedPool.id} />
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - User Position Summary */}
          <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-3 space-y-4">
              {/* User Position Summary */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Your Position</h3>
                {selectedPool && (
                  <UserPositionSummary pool={selectedPool} />
                )}
              </div>

              {/* User Event History */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Your Events</h3>
                {selectedPool && (
                  <UserEventsTimeline pool={selectedPool} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
