import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MarginPool, UserEvent } from '../../types/lending';

interface UserEventsTimelineProps {
  pool: MarginPool;
}

export function UserEventsTimeline({ pool }: UserEventsTimelineProps) {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock user events data - replace with actual data fetching
  useEffect(() => {
    const mockEvents: UserEvent[] = [
      {
        id: 'user-event-1',
        type: 'AssetSupplied',
        margin_pool_id: pool.id,
        asset_type: pool.asset_type,
        supplier: '0x1234...5678', // Mock user address
        supply_amount: '1000000000',
        supply_shares: '1000000000',
        timestamp: Date.now() - 86400000, // 1 day ago
        tx_hash: '0xabcd...efgh',
        block_number: '12345678'
      },
      {
        id: 'user-event-2',
        type: 'AssetSupplied',
        margin_pool_id: pool.id,
        asset_type: pool.asset_type,
        supplier: '0x1234...5678',
        supply_amount: '500000000',
        supply_shares: '500000000',
        timestamp: Date.now() - 172800000, // 2 days ago
        tx_hash: '0xdcba...hgfe',
        block_number: '12345670'
      },
      {
        id: 'user-event-3',
        type: 'AssetWithdrawn',
        margin_pool_id: pool.id,
        asset_type: pool.asset_type,
        supplier: '0x1234...5678',
        withdrawal_amount: '200000000',
        withdrawal_shares: '200000000',
        timestamp: Date.now() - 259200000, // 3 days ago
        tx_hash: '0x1111...2222',
        block_number: '12345660'
      },
      {
        id: 'user-event-4',
        type: 'AssetSupplied',
        margin_pool_id: pool.id,
        asset_type: pool.asset_type,
        supplier: '0x1234...5678',
        supply_amount: '750000000',
        supply_shares: '750000000',
        timestamp: Date.now() - 345600000, // 4 days ago
        tx_hash: '0x3333...4444',
        block_number: '12345650'
      }
    ];

    // Simulate loading
    setTimeout(() => {
      setEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, [pool.id, pool.asset_type]);

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount) / 1e9;
    return `${num.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
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

  const getEventDescription = (event: UserEvent) => {
    if (event.type === 'AssetSupplied') {
      return `Supplied ${formatAmount(event.supply_amount || '0')} ${pool.currency_symbol}`;
    } else if (event.type === 'AssetWithdrawn') {
      return `Withdrew ${formatAmount(event.withdrawal_amount || '0')} ${pool.currency_symbol}`;
    }
    return 'Unknown event';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Your Activity" />
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading your activity...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Your Activity" 
        subtitle="Your supply and withdrawal history"
      />
      
      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-600 mb-2">No activity yet</p>
          <p className="text-sm text-gray-500">
            Your supply and withdrawal events will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline connector */}
              {index < events.length - 1 && (
                <div className="absolute left-6 top-8 w-0.5 h-8 bg-gray-200" />
              )}
              
              <div className="flex items-start gap-4">
                {/* Event icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                </div>
                
                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={getEventColor(event.type)} className="text-xs">
                      {event.type}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">
                      {getEventDescription(event)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-4">
                      <span>Time: {formatTimestamp(event.timestamp)}</span>
                      <span>Block: {event.block_number}</span>
                    </div>
                    <div className="truncate">
                      TX: <span className="font-mono">{event.tx_hash}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Button */}
      {events.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors">
            View All Activity
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Activity Details:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Shows your last 20 transactions</li>
          <li>• Real-time updates for new events</li>
          <li>• Click on transaction hash to view on explorer</li>
          <li>• Events are sorted by most recent first</li>
        </ul>
      </div>
    </Card>
  );
}
