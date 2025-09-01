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
    <Card>
      <CardHeader 
        title="Margin Pool Events" 
        subtitle="Live stream of pool activities and transactions"
      />
      
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

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.map((event) => (
          <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="text-lg">{getEventIcon(event.type)}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge tone={getEventColor(event.type)} className="text-xs">
                  {event.type}
                </Badge>
                <span className="text-sm font-medium text-gray-900">
                  {event.type === 'AssetSupplied' 
                    ? formatAmount(event.supply_amount || '0')
                    : formatAmount(event.withdrawal_amount || '0')
                  } SUI
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>From: {event.supplier}</span>
                <span>Time: {formatTimestamp(event.timestamp)}</span>
                <span className="truncate">TX: {event.tx_hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No events yet. Events will appear here as they occur.
        </div>
      )}
    </Card>
  );
}
