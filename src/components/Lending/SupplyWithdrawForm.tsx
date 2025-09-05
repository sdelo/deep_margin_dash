import React, { useState } from 'react';
import { Button } from '../ui/Button';
import type { MarginPool } from '../../types/lending';

interface SupplyWithdrawFormProps {
  pool: MarginPool;
  selectedPools?: MarginPool[];
  allocations?: Record<string, number>;
}

export function SupplyWithdrawForm({ pool, selectedPools, allocations }: SupplyWithdrawFormProps) {
  const [action, setAction] = useState<'supply' | 'withdraw'>('supply');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const isMultiPoolMode = selectedPools && selectedPools.length > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    
    try {
      if (isMultiPoolMode && allocations) {
        // Multi-pool distribution
        const transactions = selectedPools?.map((selectedPool) => {
          const allocation = allocations[selectedPool.id] || 0;
          const distributedAmount = (parseFloat(amount) * allocation) / 100;
          return {
            poolId: selectedPool.id,
            poolName: selectedPool.name,
            amount: distributedAmount,
            currency: selectedPool.currency_symbol
          };
        }) || [];
        
        console.log(`${action === 'supply' ? 'Supply' : 'Withdraw'} distribution:`, transactions);
        
        // Mock: Execute multiple transactions
        for (const tx of transactions) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate individual tx
          console.log(`${action === 'supply' ? 'Supplied' : 'Withdrew'} ${tx.amount} ${tx.currency} to ${tx.poolName}`);
        }
      } else {
        // Single pool transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`${action === 'supply' ? 'Supplied' : 'Withdrew'} ${amount} ${pool.currency_symbol}`);
      }
      
      // Reset form
      setAmount('');
      
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatUtilizationRate = (rate: string) => {
    const percentage = parseFloat(rate) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  const formatInterestRate = (rate: string) => {
    const percentage = parseFloat(rate) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  const getMaxAmount = () => {
    if (action === 'withdraw') {
      // Mock user balance - replace with actual user position data
      return '1000';
    }
    // For supply, there's no max limit from the pool side
    return '∞';
  };

  const getEstimatedShares = () => {
    if (!amount || parseFloat(amount) <= 0) return '0';
    
    const supplyAmount = parseFloat(amount);
    const totalSupply = parseFloat(pool.total_supply);
    const totalShares = totalSupply; // Simplified calculation
    
    if (action === 'supply') {
      return supplyAmount.toFixed(6);
    } else {
      // For withdrawal, estimate shares based on current ratio
      return (supplyAmount * totalShares / totalSupply).toFixed(6);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setAction('supply')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            action === 'supply'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Supply
        </button>
        <button
          onClick={() => setAction('withdraw')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            action === 'withdraw'
              ? 'bg-white text-red-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount ({pool.currency_symbol})
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setAmount(getMaxAmount())}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Max: {getMaxAmount()} {pool.currency_symbol}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2">
          {action === 'withdraw' && (
            <button
              type="button"
              onClick={() => setAmount(getMaxAmount())}
              className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Withdraw All
            </button>
          )}
          {action === 'supply' && (
            <button
              type="button"
              onClick={() => {
                // Mock: Add to existing position (could be a percentage of current position)
                const existingPosition = '500'; // Mock existing position
                setAmount(existingPosition);
              }}
              className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              Add to Existing Position
            </button>
          )}
        </div>

        {/* Multi-Pool Distribution Preview */}
        {isMultiPoolMode && amount && parseFloat(amount) > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {action === 'supply' ? 'Supply' : 'Withdraw'} Distribution Across Pools:
            </h4>
            <div className="space-y-2">
              {selectedPools?.map((selectedPool) => {
                const allocation = allocations?.[selectedPool.id] || 0;
                const distributedAmount = (parseFloat(amount) * allocation) / 100;
                return (
                  <div key={selectedPool.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {selectedPool.currency_symbol} ({allocation.toFixed(1)}%)
                    </span>
                    <span className="font-medium text-gray-900">
                      {distributedAmount.toFixed(2)} {selectedPool.currency_symbol}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estimated Shares */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated {action === 'supply' ? 'Shares' : 'Amount'}:</span>
            <span className="font-medium text-gray-900">
              {getEstimatedShares()} {action === 'supply' ? 'shares' : pool.currency_symbol}
            </span>
          </div>
        </div>

        {/* Transaction Button */}
        <Button
          type="submit"
          variant={action === 'supply' ? 'primary' : 'outline'}
          className="w-full"
          disabled={isLoading || !amount || parseFloat(amount) <= 0}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            isMultiPoolMode 
              ? `${action === 'supply' ? 'Supply' : 'Withdraw'} Across ${selectedPools?.length} Pools`
              : `${action === 'supply' ? 'Supply' : 'Withdraw'} ${pool.currency_symbol}`
          )}
        </Button>
      </form>

      {/* Info Box */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Important Notes:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Interest is earned continuously on supplied assets</li>
          <li>• Withdrawals may be subject to cooldown periods</li>
          <li>• Rates are variable and change based on utilization</li>
          <li>• Ensure you have sufficient balance for transactions</li>
        </ul>
      </div>
    </div>
  );
}
