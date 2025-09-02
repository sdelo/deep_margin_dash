import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { deepbookDataService } from './services/deepbookDataService'
import type { DeepBookV3Data } from './types/deepbook'
import { PoolsTable } from './components/PoolsTable'
import { LiquidationsFeed } from './components/LiquidationsFeed'
import { BorrowersExplorer } from './components/BorrowersExplorer'
import { AppHeader } from './components/AppHeader'
import { EnhancedLendingPage } from './components/Lending/EnhancedLendingPage'
import { Button } from './components/ui/Button'
import { Card, CardHeader } from './components/ui/Card'
import { Badge } from './components/ui/Badge'
import { WalletTest } from './components/Wallet/WalletTest'
import { initializeTheme } from './utils/theme'
import './App.css'

type TimeRange = '24h' | '7d' | '30d' | 'all'
type ActiveTab = 'overview' | 'pools' | 'liquidations' | 'borrowers' | 'lending'

function App() {
  const [data, setData] = useState<DeepBookV3Data>({ 
    margin_managers: [], 
    margin_pools: [], 
    deepbook_pools: [],
    position_health_events: [],
    interest_accrual_events: [],
    liquidation_risk_alerts: [],
    price_impact_events: [],
    last_updated: Date.now(),
    data_source: 'static'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [dataSource, setDataSource] = useState<'api' | 'static' | 'rpc' | 'events'>('api')

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Initialize theme
  useEffect(() => {
    initializeTheme()
  }, [])

  const rangeStartMs = (): number => {
    const now = Date.now()
    switch (timeRange) {
      case '24h':
        return now - 24 * 60 * 60 * 1000
      case '7d':
        return now - 7 * 24 * 60 * 60 * 1000
      case '30d':
        return now - 30 * 24 * 60 * 60 * 1000
      case 'all':
      default:
        return 0
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const allData = await deepbookDataService.getDeepBookV3Data()
      setData(allData)
      setDataSource(allData.data_source)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const startMs = rangeStartMs()

  // Calculate KPIs - using DeepBook data structure
  const kpis = {
    // Always 24h for this one (as per spec)
    newMarginTraders: data.margin_managers.filter(m => m.created_at > Date.now() - 86400000).length,
    activeTraders: new Set(
      data.margin_managers
        .filter(m => m.created_at >= startMs)
        .map(m => m.owner)
    ).size,
    // For now, using placeholder values since the new structure doesn't have loans/liquidations yet
    borrowed: 0, // TODO: Calculate from position_health_events
    repaid: 0,   // TODO: Calculate from position_health_events
    liquidations: 0, // TODO: Calculate from liquidation_risk_alerts
    defaults: 0,     // TODO: Calculate from liquidation_risk_alerts
    poolRewards: 0,  // TODO: Calculate from liquidation_risk_alerts
  }

  const liqRepaidInRange = 0 // TODO: Calculate from liquidation_risk_alerts

  const netDebtChange = kpis.borrowed - kpis.repaid - liqRepaidInRange

  // Prepare chart data - using DeepBook data structure
  // TODO: Replace with actual data from position_health_events and liquidation_risk_alerts
  const chartData = [
    { date: '2024-01-01', borrowed: 0, repaid: 0 },
    { date: '2024-01-02', borrowed: 0, repaid: 0 },
    { date: '2024-01-03', borrowed: 0, repaid: 0 }
  ]

  const liquidationChartData = [
    { date: '2024-01-01', count: 0, amount: 0 },
    { date: '2024-01-02', count: 0, amount: 0 },
    { date: '2024-01-03', count: 0, amount: 0 }
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={loadData} className="btn-primary">Retry</button>
        </div>
      </div>
    )
  }

  const RangeButton = ({ label, value }: { label: string; value: TimeRange }) => (
    <button
      onClick={() => setTimeRange(value)}
      style={{
        backgroundColor: timeRange === value ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.1)',
        color: timeRange === value ? 'white' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid',
        borderColor: timeRange === value ? 'rgba(139, 92, 246, 0.9)' : 'rgba(139, 92, 246, 0.3)',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: timeRange === value ? '0 0 15px rgba(139, 92, 246, 0.4)' : '0 0 5px rgba(139, 92, 246, 0.1)'
      }}
    >
      {label}
    </button>
  )

  // TabButton component definition
  const TabButton = ({ label, value }: { label: string; value: ActiveTab }) => {
    console.log('TabButton render:', label, value, activeTab === value);
    return (
      <button
        onClick={() => setActiveTab(value)}
        style={{
          backgroundColor: activeTab === value ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.15)',
          border: '1px solid',
          borderColor: activeTab === value ? 'rgba(139, 92, 246, 0.9)' : 'rgba(139, 92, 246, 0.4)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          margin: '0 2px',
          minWidth: '120px',
          textAlign: 'center' as const,
          boxShadow: activeTab === value ? '0 0 20px rgba(139, 92, 246, 0.4)' : '0 0 5px rgba(139, 92, 246, 0.1)',
          transition: 'all 0.2s ease'
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="min-h-screens mx-5">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <main className=" py-6">

        {activeTab === 'overview' ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader 
                  title="New Margin Traders (24h)" 
                  subtitle="Active today"
                />
                <p className="text-3xl font-bold text-brand-600">{kpis.newMarginTraders}</p>
              </Card>
              
              <Card>
                <CardHeader 
                  title="Active Traders" 
                  subtitle="In selected range"
                />
                <p className="text-3xl font-bold text-brand-600">{kpis.activeTraders}</p>
              </Card>
              
              <Card>
                <CardHeader 
                  title="Borrowed (range)" 
                  subtitle="Total borrowed"
                />
                <p className="text-3xl font-bold text-brand-600">${(kpis.borrowed / 1_000_000).toFixed(1)}M</p>
              </Card>
              
              <Card>
                <CardHeader 
                  title="Net Debt Change" 
                  subtitle="Selected range"
                />
                <p className={`text-3xl font-bold ${netDebtChange >= 0 ? 'text-success-500' : 'text-destructive-500'}`}>
                  {netDebtChange >= 0 ? '+' : ''}${(netDebtChange / 1_000_000).toFixed(1)}M
                </p>
              </Card>
            </div>

            {/* Additional KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader 
                  title="Liquidations (range)" 
                  subtitle="Events"
                />
                <p className="text-3xl font-bold text-brand-600">{kpis.liquidations}</p>
              </Card>
              
              <Card>
                <CardHeader 
                  title="Defaults" 
                  subtitle="Total losses"
                />
                <p className="text-3xl font-bold text-brand-600">${(kpis.defaults / 1_000).toFixed(1)}K</p>
              </Card>
              
              <Card>
                <CardHeader 
                  title="Pool Rewards" 
                  subtitle="Protocol income"
                />
                <p className="text-3xl font-bold text-brand-600">${(kpis.poolRewards / 1_000).toFixed(1)}K</p>
              </Card>
            </div>

            {/* DeepBook v3 Integration Status */}
            <div className="mb-8">
              <Card>
                <CardHeader title="DeepBook v3 Integration" subtitle="Real-time margin trading metrics" />
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-600">5</div>
                      <div className="text-sm text-muted-foreground">Total Positions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive-500">4</div>
                      <div className="text-sm text-muted-foreground">At Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning-500">1.49x</div>
                      <div className="text-sm text-muted-foreground">Avg Health</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success-500">$3.90</div>
                      <div className="text-sm text-muted-foreground">Total Equity</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-brand-600">0s ago</div>
                      <div className="text-sm text-muted-foreground">Oracle Freshness</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-brand-600">6.03%</div>
                      <div className="text-sm text-muted-foreground">Weighted Borrow APR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-brand-600">$0.00</div>
                      <div className="text-sm text-muted-foreground">Encumbered (Orders)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-brand-600">STATIC</div>
                      <div className="text-sm text-muted-foreground">Data Mode</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader title={`Borrow vs Repay (${timeRange})`} />
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${(Number(value) / 1000).toFixed(1)}K`, '']} />
                      <Line type="monotone" dataKey="borrowed" stroke="hsl(var(--brand-500))" strokeWidth={2} name="Borrowed" />
                      <Line type="monotone" dataKey="repaid" stroke="hsl(var(--success-500))" strokeWidth={2} name="Repaid" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              
              <Card>
                <CardHeader title={`Liquidations (${timeRange})`} />
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liquidationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [name === 'amount' ? `$${(Number(value) / 1000).toFixed(1)}K` : value, name === 'amount' ? 'Amount' : 'Count']} />
                      <Bar dataKey="count" fill="hsl(var(--destructive-500))" name="Count" />
                      <Bar dataKey="amount" fill="hsl(var(--warning-500))" name="Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Latest Liquidations Ticker */}
            <Card>
              <CardHeader title="Latest Liquidations" />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">Pool</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">Default Ratio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-fg/70 uppercase tracking-wider">Pool Reward</th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-border">
                    {/* TODO: Replace with actual liquidation data from liquidation_risk_alerts */}
                    <tr className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fg text-center" colSpan={5}>
                        <div className="text-gray-500">
                          <div className="text-lg mb-2">🚧</div>
                          <div>Liquidation data coming soon</div>
                          <div className="text-sm">Converting from DeepBook v3 events...</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Wallet Test Component */}
            <div className="mb-8">
              <WalletTest />
            </div>
          </>
        ) : activeTab === 'pools' ? (
          /* Pools & Debt Tab */
          <PoolsTable loans={[]} liquidations={[]} />
        ) : activeTab === 'liquidations' ? (
          /* Liquidations Feed Tab */
          <LiquidationsFeed 
            liquidations={[]} 
            loans={[]} 
          />
        ) : activeTab === 'lending' ? (
          /* Lending Tab */
          <EnhancedLendingPage />
        ) : (
          /* Borrowers Explorer Tab */
          <BorrowersExplorer 
            managers={data.margin_managers}
            loans={[]}
            liquidations={[]}
          />
        )}
      </main>
    </div>
  )
}

export default App
