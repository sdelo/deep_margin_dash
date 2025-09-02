import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MarginPoolEvent } from '../../types/lending';

interface MarginPoolEventsProps {
  poolId: string;
}

export function MarginPoolEvents({ poolId }: MarginPoolEventsProps) {
  const [events, setEvents] = useState<MarginPoolEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Mock data - replace with actual event streaming
  useEffect(() => {
    const mockEvents: MarginPoolEvent[] = [
      {
        id: 'event-1',
        type: 'AssetSupplied',
        margin_pool_id: poolId,
        asset_type: '0x2::sui::SUI',
        supplier: '0x1234...5678',
        supply_amount: '1000000000',
        supply_shares: '1000000000',
        timestamp: Date.now() - 300000, // 5 minutes ago
        tx_hash: '0xabcd...efgh'
      },
      {
        id: 'event-2',
        type: 'AssetWithdrawn',
        margin_pool_id: poolId,
        asset_type: '0x2::sui::SUI',
        supplier: '0x8765...4321',
        withdrawal_amount: '500000000',
        withdrawal_shares: '500000000',
        timestamp: Date.now() - 600000, // 10 minutes ago
        tx_hash: '0xdcba...hgfe'
      },
      {
        id: 'event-3',
        type: 'AssetSupplied',
        margin_pool_id: poolId,
        asset_type: '0x2::sui::SUI',
        supplier: '0x9999...8888',
        supply_amount: '2000000000',
        supply_shares: '2000000000',
        timestamp: Date.now() - 900000, // 15 minutes ago
        tx_hash: '0x1111...2222'
      },
      {
        id: 'event-4',
        type: 'AssetWithdrawn',
        margin_pool_id: poolId,
        asset_type: '0x2::sui::SUI',
        supplier: '0x7777...6666',
        withdrawal_amount: '750000000',
        withdrawal_shares: '750000000',
        timestamp: Date.now() - 1200000, // 20 minutes ago
        tx_hash: '0x3333...4444'
      }
    ];

    setEvents(mockEvents);

    // Simulate live updates
    if (isLive) {
      const interval = setInterval(() => {
        const newEvent: MarginPoolEvent = {
          id: `event-${Date.now()}`,
          type: Math.random() > 0.5 ? 'AssetSupplied' : 'AssetWithdrawn',
          margin_pool_id: poolId,
          asset_type: '0x2::sui::SUI',
          supplier: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`,
          supply_amount: Math.random() > 0.5 ? '1000000000' : '2000000000',
          supply_shares: Math.random() > 0.5 ? '1000000000' : '2000000000',
          withdrawal_amount: Math.random() > 0.5 ? '500000000' : '1000000000',
          withdrawal_shares: Math.random() > 0.5 ? '500000000' : '1000000000',
          timestamp: Date.now(),
          tx_hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`
        };
        
        setEvents(prev => [newEvent, ...prev.slice(0, 19)]); // Keep only last 20 events
      }, 10000); // Add new event every 10 seconds

      return () => clearInterval(interval);
    }
  }, [poolId, isLive]);

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount) / 1e9;
    return `${num.toFixed(2)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'AssetSupplied':
        return '📥';
      case 'AssetWithdrawn':
        return '📤';
      default:
        return '📊';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'AssetSupplied':
        return 'positive';
      case 'AssetWithdrawn':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {isLive ? 'Live Updates' : 'Paused'}
          </span>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isLive ? 'Pause' : 'Resume'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-700">Margin ID</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-700">Asset Type</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-700">Address</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-700">Amount</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-700">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-2 px-3 text-xs text-gray-900">
                  {event.margin_pool_id.slice(0, 8)}...
                </td>
                <td className="py-2 px-3">
                  <Badge tone={getEventColor(event.type)} className="text-xs">
                    {event.type}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-xs text-gray-900">
                  {event.supplier.slice(0, 8)}...
                </td>
                <td className="py-2 px-3 text-xs font-medium text-gray-900">
                  {event.type === 'AssetSupplied' 
                    ? formatAmount(event.supply_amount || '0')
                    : formatAmount(event.withdrawal_amount || '0')
                  } SUI
                </td>
                <td className="py-2 px-3 text-xs text-gray-500">
                  {formatTimestamp(event.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No events yet. Events will appear here as they occur.
        </div>
      )}
    </div>
  );
}
