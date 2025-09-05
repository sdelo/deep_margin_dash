import React, { useState, useEffect } from 'react';
import { EnhancedMarginPoolsList } from './EnhancedMarginPoolsList';
import { CombinedPoolView } from './CombinedPoolView';
import { DeepBookPoolsSection } from './DeepBookPoolsSection';
import { MarginPoolEvents } from './MarginPoolEvents';
import { SupplyWithdrawForm } from './SupplyWithdrawForm';
import { UserPositionSummary } from './UserPositionSummary';
import { UserEventsTimeline } from './UserEventsTimeline';
import { UtilizationCurve } from './UtilizationCurve';
import type { MarginPool } from '../../types/lending';

export function EnhancedLendingPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('detail');
  const [selectedPool, setSelectedPool] = useState<MarginPool | null>(null);
  const [selectedPools, setSelectedPools] = useState<MarginPool[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [positionData, setPositionData] = useState<Record<string, any>>({});

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
    },
    {
      id: 'pool-3',
      asset_type: '0x1::aptos_coin::AptosCoin',
      total_supply: '75000000000',
      total_borrow: '45000000000',
      utilization_rate: '0.4',
      base_rate: '0.025',
      base_slope: '0.12',
      optimal_utilization: '0.85',
      excess_slope: '0.6',
      last_index_update_timestamp: Date.now(),
      current_rate: '0.085',
      daily_interest_cost_usd: '2125',
      weekly_interest_cost_usd: '14875',
      supply_cap: '150000000000',
      protocol_spread: '0.12',
      protocol_profit: '3600000000',
      vault_value: '75000000000',
      unique_positions: 22,
      allowed_deepbook_pools: ['deepbook-pool-4', 'deepbook-pool-5'],
      name: 'APT Margin Pool',
      currency_symbol: 'APT'
    }
  ];

  // Auto-select first pool if none selected
  useEffect(() => {
    if (!selectedPool && activeTab === 'detail') {
      setSelectedPool(marginPools[0]);
    }
  }, [activeTab]);

  // Handle pool selection
  const handlePoolSelect = (pool: MarginPool) => {
    setSelectedPool(pool);
    // If we're in multi-pool mode, also update selected pools
    if (selectedPools.length > 0) {
      if (!selectedPools.find(p => p.id === pool.id)) {
        setSelectedPools([...selectedPools, pool]);
      }
    }
  };

  // Handle pool toggle for multi-selection
  const handlePoolToggle = (pool: MarginPool, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPools([...selectedPools, pool]);
    } else {
      setSelectedPools(selectedPools.filter(p => p.id !== pool.id));
    }
  };

  // Handle select all pools
  const handleSelectAll = () => {
    setSelectedPools([...marginPools]);
  };

  // Handle clear all selections
  const handleClearAll = () => {
    setSelectedPools([]);
  };

  // Handle allocation changes
  const handleAllocationChange = (poolId: string, allocation: number) => {
    console.log(`Pool ${poolId} allocation changed to ${allocation}%`);
    setAllocations(prev => ({
      ...prev,
      [poolId]: allocation
    }));
  };

  // Handle position data changes from CombinedPoolView
  const handlePositionDataChange = (positions: Record<string, any>) => {
    console.log('EnhancedLendingPage - received position data:', positions);
    setPositionData(positions);
  };

  // Handle batch supply
  const handleBatchSupply = (allocations: Record<string, number>) => {
    console.log('Batch supply with allocations:', allocations);
    // TODO: Implement batch supply logic
  };

  // Handle batch withdraw
  const handleBatchWithdraw = (allocations: Record<string, number>) => {
    console.log('Batch withdraw with allocations:', allocations);
    // TODO: Implement batch withdraw logic
  };

  // Handle rebalancing
  const handleRebalance = (strategy: 'equal' | 'risk-adjusted' | 'yield-optimized' | 'custom') => {
    console.log('Rebalancing with strategy:', strategy);
    // TODO: Implement rebalancing logic
  };

  // Select all user's active pools - show 2 pools as requested
  const selectAllActivePools = () => {
    // Select first 2 pools to show 2 positions as requested
    const pools = [marginPools[0], marginPools[1]];
    setSelectedPools(pools);
    
    // Initialize equal allocations
    const equalAllocation = 100 / pools.length;
    const initialAllocations: Record<string, number> = {};
    pools.forEach(pool => {
      initialAllocations[pool.id] = equalAllocation;
    });
    setAllocations(initialAllocations);
  };

  const isMultiPoolMode = selectedPools.length > 1;

  // Calculate total capital for multi-pool view
  const totalCapital = selectedPools.reduce((total, pool) => {
    return total + parseFloat(pool.total_supply) / 1e9;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
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

          {/* Selection Status */}
          {selectedPools.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedPools.length} pool{selectedPools.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      </div>

      {activeTab === 'list' ? (
        /* List View - Full width cards */
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Margin Pools</h1>
            <EnhancedMarginPoolsList 
              pools={marginPools}
              selectedPools={selectedPools}
              onPoolSelect={handlePoolSelect}
              onPoolToggle={handlePoolToggle}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
              showCheckboxes={false}
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
              
              <EnhancedMarginPoolsList 
                pools={marginPools}
                selectedPools={selectedPools}
                onPoolSelect={handlePoolSelect}
                onPoolToggle={handlePoolToggle}
                onSelectAll={handleSelectAll}
                onClearAll={handleClearAll}
                compact={true}
                showCheckboxes={true}
              />
            </div>
          </div>

          {/* Central Content Area */}
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            <div className="px-4 py-6 h-full flex flex-col">
              {/* Top Row: Left side (Margin Pool Details OR Multi-Pool View) + Supply/Withdraw side by side */}
              <div className="flex gap-6 mb-2" style={{ height: '60%' }}>
                {/* Left side (60%) - Either Margin Pool Details OR Multi-Pool View */}
                <div className="w-3/5 overflow-y-auto">
                  {isMultiPoolMode ? (
                    /* Multi-Pool View - replaces only the Margin Pool Details section */
                    <CombinedPoolView
                      selectedPools={selectedPools}
                      totalCapital={totalCapital}
                      onAllocationChange={handleAllocationChange}
                      onBatchSupply={handleBatchSupply}
                      onBatchWithdraw={handleBatchWithdraw}
                      onRebalance={handleRebalance}
                      allocations={allocations}
                      setAllocations={setAllocations}
                      onPositionDataChange={handlePositionDataChange}
                    />
                  ) : (
                    /* Single Pool View - Margin Pool Details */
                    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
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
                  )}
                </div>

                {/* Supply/Withdraw Section - Right side (always visible) */}
                <div className="flex-1 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Supply / Withdraw</h2>
                  {selectedPool && (
                    <SupplyWithdrawForm 
                      pool={selectedPool} 
                      selectedPools={isMultiPoolMode ? selectedPools : undefined}
                      allocations={isMultiPoolMode ? allocations : undefined}
                    />
                  )}
                </div>
              </div>

              {/* Linked DeepBook Pools - Same width as left side */}
              <div className="w-3/5 bg-white rounded-lg shadow-sm p-3 mb-2 flex-shrink-0 overflow-y-auto" style={{ height: '15%' }}>
                <h2 className="text-sm font-bold text-gray-900 mb-2">
                  Linked DeepBook Pools ({selectedPool?.allowed_deepbook_pools.length || 0} pools)
                </h2>
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Your Position</h3>
                  <button
                    onClick={selectAllActivePools}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Select All Active
                  </button>
                </div>
                {selectedPool && (
                  <UserPositionSummary 
                    pool={selectedPool} 
                    positionData={positionData}
                  />
                )}
                {/* Debug info */}
                {selectedPool && (
                  <div className="text-xs text-gray-400 mt-2">
                    Debug: all positionData: {JSON.stringify(positionData)}
                  </div>
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
