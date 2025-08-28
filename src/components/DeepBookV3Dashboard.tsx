import React from 'react'
import { useDeepBookData } from '../hooks/useDeepBookData'
import { formatUSD, formatPercentage, getHealthStatusColor, formatLargeNumber } from '../utils/deepbookUtils'
import type { PositionSummary } from '../types/deepbook'

export function DeepBookV3Dashboard() {
  const { 
    data, 
    positionSummaries, 
    dashboardMetrics, 
    loading, 
    error, 
    refresh, 
    updateDataSource 
  } = useDeepBookData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading DeepBook v3 data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">DeepBook v3 Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Data Source: <span className="font-medium">{data?.data_source}</span>
              </span>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* Data Source Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => updateDataSource('static')}
              className={`px-3 py-1 rounded-md text-sm ${
                data?.data_source === 'static' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Static Data
            </button>
            <button
              onClick={() => updateDataSource('rpc')}
              className={`px-3 py-1 rounded-md text-sm ${
                data?.data_source === 'rpc' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              RPC (Coming Soon)
            </button>
            <button
              onClick={() => updateDataSource('events')}
              className={`px-3 py-1 rounded-md text-sm ${
                data?.data_source === 'events' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Events (Coming Soon)
            </button>
          </div>
        </div>

        {/* Dashboard Metrics */}
        {dashboardMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Total Positions"
              value={dashboardMetrics.total_positions.toString()}
              subtitle="Active margin managers"
            />
            <MetricCard
              title="Total Net Equity"
              value={formatUSD(toMoveValue(dashboardMetrics.total_net_equity_usd))}
              subtitle="Combined position value"
            />
            <MetricCard
              title="Total Debt"
              value={formatUSD(toMoveValue(dashboardMetrics.total_debt_usd))}
              subtitle="Combined borrowed amount"
            />
            <MetricCard
              title="Positions at Risk"
              value={dashboardMetrics.positions_at_risk.toString()}
              subtitle="Warning or danger status"
              valueColor={dashboardMetrics.positions_at_risk > 0 ? 'text-red-600' : 'text-green-600'}
            />
          </div>
        )}

        {/* Positions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Margin Positions</h2>
            <p className="text-sm text-gray-500">
              {positionSummaries.length} positions • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Equity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health Factor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrow Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance to Liquidation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {positionSummaries.map((position) => (
                  <tr key={position.manager_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {position.owner.slice(0, 8)}...{position.owner.slice(-6)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        position.net_equity_usd >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatUSD(toMoveValue(position.net_equity_usd))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {position.health_factor.toFixed(2)}x
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatPercentage(toMoveValue(position.borrow_usage))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {position.distance_to_liquidation.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full`}
                        style={{
                          backgroundColor: getHealthStatusColor(position.health_status) + '20',
                          color: getHealthStatusColor(position.health_status)
                        }}
                      >
                        {position.health_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw Data Debug */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Raw Data (Debug)</h3>
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer hover:text-gray-800">Click to expand</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  valueColor = 'text-gray-900' 
}: {
  title: string
  value: string
  subtitle: string
  valueColor?: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
      <dd className={`mt-1 text-3xl font-semibold ${valueColor}`}>{value}</dd>
      <dd className="text-sm text-gray-500 mt-1">{subtitle}</dd>
    </div>
  )
}

// Helper function to convert number back to Move format for display
function toMoveValue(value: number): string {
  return Math.round(value * 1000000000).toString()
}
