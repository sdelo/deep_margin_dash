import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { dataService } from './services/dataService'
import type { DashboardData } from './types/data'
import { PoolsTable } from './components/PoolsTable'
import { LiquidationsFeed } from './components/LiquidationsFeed'
import { BorrowersExplorer } from './components/BorrowersExplorer'
import { AppHeader } from './components/AppHeader'
import { Button } from './components/ui/Button'
import { Card, CardHeader } from './components/ui/Card'
import { Badge } from './components/ui/Badge'
import { initializeTheme } from './utils/theme'
import './App.css'

type TimeRange = '24h' | '7d' | '30d' | 'all'
type ActiveTab = 'overview' | 'pools' | 'liquidations' | 'borrowers'

function App() {
  const [data, setData] = useState<DashboardData>({ 
    managers: [], 
    loans: [], 
    liquidations: [],
    dataSource: 'api'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [dataSource, setDataSource] = useState<'api' | 'static'>('api')

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
      const allData = await dataService.getData()
      setData(allData)
      setDataSource(allData.dataSource)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const startMs = rangeStartMs()

  // Calculate KPIs
  const kpis = {
    // Always 24h for this one (as per spec)
    newMarginTraders: data.managers.filter(m => m.created_at > Date.now() - 86400000).length,
    activeTraders: new Set(
      data.managers
        .filter(m => m.created_at >= startMs)
        .map(m => m.owner)
    ).size,
    borrowed: (timeRange === 'all' ? data.loans : data.loans.filter(l => l.borrowed_at >= startMs))
      .filter(l => l.status === 'borrowed' || l.status === 'repaid' || l.status === 'liquidated')
      .reduce((sum, l) => sum + l.loan_amount, 0),
    repaid: (timeRange === 'all' ? data.loans : data.loans.filter(l => (l.repaid_at ?? 0) >= startMs))
      .filter(l => l.repaid_at)
      .reduce((sum, l) => sum + (l.loan_amount), 0),
    liquidations: (timeRange === 'all' ? data.liquidations : data.liquidations.filter(l => l.liquidated_at >= startMs)).length,
    defaults: (timeRange === 'all' ? data.liquidations : data.liquidations.filter(l => l.liquidated_at >= startMs))
      .reduce((sum, l) => sum + l.default_amount, 0),
    poolRewards: (timeRange === 'all' ? data.liquidations : data.liquidations.filter(l => l.liquidated_at >= startMs))
      .reduce((sum, l) => sum + l.pool_reward_amount, 0),
  }

  const liqRepaidInRange = (timeRange === 'all' ? data.liquidations : data.liquidations.filter(l => l.liquidated_at >= startMs))
    .reduce((sum, l) => sum + (l.liquidation_amount - l.default_amount), 0)

  const netDebtChange = kpis.borrowed - kpis.repaid - liqRepaidInRange

  // Prepare chart data
  const filteredLoans = timeRange === 'all' ? data.loans : data.loans.filter(loan => loan.borrowed_at >= startMs)
  const chartData = filteredLoans
    .reduce((acc, loan) => {
      const date = new Date(loan.borrowed_at).toLocaleDateString()
      const existing = acc.find(item => item.date === date)
      
      if (existing) {
        existing.borrowed += loan.loan_amount
        if (loan.repaid_at) {
          existing.repaid += loan.loan_amount
        }
      } else {
        acc.push({
          date,
          borrowed: loan.loan_amount,
          repaid: loan.repaid_at ? loan.loan_amount : 0
        })
      }
      return acc
    }, [] as { date: string; borrowed: number; repaid: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const filteredLiquidations = timeRange === 'all' ? data.liquidations : data.liquidations.filter(liq => liq.liquidated_at >= startMs)
  const liquidationChartData = filteredLiquidations
    .reduce((acc, liq) => {
      const date = new Date(liq.liquidated_at).toLocaleDateString()
      const existing = acc.find(item => item.date === date)
      
      if (existing) {
        existing.count += 1
        existing.amount += liq.liquidation_amount
      } else {
        acc.push({
          date,
          count: 1,
          amount: liq.liquidation_amount
        })
      }
      return acc
    }, [] as { date: string; count: number; amount: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

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
    <div className="min-h-screen bg-bg">
      <AppHeader />
      
      {/* Main Content */}
      <main className="container py-6">
        {/* Time Range Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <RangeButton label="24h" value="24h" />
            <RangeButton label="7d" value="7d" />
            <RangeButton label="30d" value="30d" />
            <RangeButton label="All" value="all" />
          </div>
          
          {/* Data Source Indicator */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)'
            }}
          >
            <span className="text-sm text-fg/70">Data:</span>
            <Badge 
              tone={dataSource === 'api' ? 'positive' : 'info'}
              className="text-xs"
            >
              {dataSource === 'api' ? 'Live API' : 'Static File'}
            </Badge>
          </div>
          
          <Button 
            onClick={loadData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          
          {/* Data Source Toggle (Development Only) */}
          {import.meta.env.DEV && (
            <Button 
              onClick={() => {
                const newSource = dataSource === 'api' ? 'static' : 'api'
                dataService.setDataSource(newSource)
                setDataSource(newSource)
                loadData()
              }}
              variant="ghost"
              size="sm"
              title="Toggle between API and static data (dev only)"
            >
              Switch to {dataSource === 'api' ? 'Static' : 'API'}
            </Button>
          )}
          
          {data.lastUpdated && (
            <span className="text-xs text-fg/50 ml-auto">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div 
          className="flex items-center gap-1 p-2 rounded-lg w-fit mb-6"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '2px solid rgba(139, 92, 246, 0.6)',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
            zIndex: 9999,
            position: 'relative'
          }}
        >
          <TabButton label="Overview" value="overview" />
          <TabButton label="Pools & Debt" value="pools" />
          <TabButton label="Liquidations Feed" value="liquidations" />
          <TabButton label="Borrowers Explorer" value="borrowers" />
        </div>

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
                    {data.liquidations
                      .sort((a, b) => b.liquidated_at - a.liquidated_at)
                      .slice(0, 20)
                      .map((liq) => (
                      <tr key={liq.id} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                          {new Date(liq.liquidated_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">
                          {liq.margin_pool_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                          ${(liq.liquidation_amount / 1000).toFixed(1)}K
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                          {((liq.default_amount / liq.liquidation_amount) * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-fg">
                          ${(liq.pool_reward_amount / 1000).toFixed(1)}K
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : activeTab === 'pools' ? (
          /* Pools & Debt Tab */
          <PoolsTable loans={data.loans} liquidations={data.liquidations} />
        ) : activeTab === 'liquidations' ? (
          /* Liquidations Feed Tab */
          <LiquidationsFeed 
            liquidations={data.liquidations} 
            loans={data.loans} 
          />
        ) : (
          /* Borrowers Explorer Tab */
          <BorrowersExplorer 
            managers={data.managers}
            loans={data.loans} 
            liquidations={data.liquidations}
          />
        )}
      </main>
    </div>
  )
}

export default App
