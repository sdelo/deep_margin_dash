import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { dataService } from './services/dataService'
import type { DashboardData } from './types/data'
import { PoolsTable } from './components/PoolsTable'
import { LiquidationsFeed } from './components/LiquidationsFeed'
import { BorrowersExplorer } from './components/BorrowersExplorer'
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
      className={`px-3 py-1 rounded-md border text-sm ${
        timeRange === value
          ? 'bg-blue-600 text-white border-blue-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )

  const TabButton = ({ label, value }: { label: string; value: ActiveTab }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium rounded-lg ${
        activeTab === value
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">DeepBook Liquidation Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time margin trading insights</p>
              {data.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(data.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 mr-2">
                <RangeButton label="24h" value="24h" />
                <RangeButton label="7d" value="7d" />
                <RangeButton label="30d" value="30d" />
                <RangeButton label="All" value="all" />
              </div>
              
              {/* Data Source Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600">Data:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  dataSource === 'api' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {dataSource === 'api' ? 'Live API' : 'Static File'}
                </span>
              </div>
              
              <button 
                onClick={loadData}
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              
              {/* Data Source Toggle (Development Only) */}
              {import.meta.env.DEV && (
                <button 
                  onClick={() => {
                    const newSource = dataSource === 'api' ? 'static' : 'api'
                    dataService.setDataSource(newSource)
                    setDataSource(newSource)
                    loadData()
                  }}
                  className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  title="Toggle between API and static data (dev only)"
                >
                  Switch to {dataSource === 'api' ? 'Static' : 'API'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <TabButton label="Overview" value="overview" />
          <TabButton label="Pools & Debt" value="pools" />
          <TabButton label="Liquidations Feed" value="liquidations" />
          <TabButton label="Borrowers Explorer" value="borrowers" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="kpi-card">
                <h3 className="text-sm font-medium text-blue-700">New Margin Traders (24h)</h3>
                <p className="text-3xl font-bold text-blue-900 mt-2">{kpis.newMarginTraders}</p>
                <p className="text-sm text-blue-600 mt-1">Active today</p>
              </div>
              
              <div className="kpi-card">
                <h3 className="text-sm font-medium text-blue-700">Active Traders</h3>
                <p className="text-3xl font-bold text-blue-900 mt-2">{kpis.activeTraders}</p>
                <p className="text-sm text-blue-600 mt-1">In selected range</p>
              </div>
              
              <div className="kpi-card">
                <h3 className="text-sm font-medium text-blue-700">Borrowed (range)</h3>
                <p className="text-3xl font-bold text-blue-900 mt-2">${(kpis.borrowed / 1_000_000).toFixed(1)}M</p>
                <p className="text-sm text-blue-600 mt-1">Total borrowed</p>
              </div>
              
              <div className="kpi-card">
                <h3 className="text-sm font-medium text-blue-700">Net Debt Change</h3>
                <p className={`text-3xl font-bold mt-2 ${netDebtChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netDebtChange >= 0 ? '+' : ''}${(netDebtChange / 1_000_000).toFixed(1)}M
                </p>
                <p className="text-sm text-blue-600 mt-1">Selected range</p>
              </div>
            </div>

            {/* Additional KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="kpi-card">
                <h3 className="text-sm font-medium text-blue-700">Liquidations (range)</h3>
                <p className="text-3xl font-bold text-blue-900 mt-2">{kpis.liquidations}</p>
                <p className="text-sm text-blue-600 mt-1">Events</p>
              </div>
              
              <div className="kpi-card">
                <h3 className="text-sm font-medium text-blue-700">Defaults</h3>
                <p className="text-3xl font-bold text-blue-900 mt-2">${(kpis.defaults / 1_000).toFixed(1)}K</p>
                <p className="text-sm text-blue-600 mt-1">Total losses</p>
              </div>
              
              <div className="kpi-card">
                <h3 className="text-sm font-medium text-blue-700">Pool Rewards</h3>
                <p className="text-3xl font-bold text-blue-900 mt-2">${(kpis.poolRewards / 1_000).toFixed(1)}K</p>
                <p className="text-sm text-blue-600 mt-1">Protocol income</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Borrow vs Repay ({timeRange})</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${(Number(value) / 1000).toFixed(1)}K`, '']} />
                      <Line type="monotone" dataKey="borrowed" stroke="#3b82f6" strokeWidth={2} name="Borrowed" />
                      <Line type="monotone" dataKey="repaid" stroke="#10b981" strokeWidth={2} name="Repaid" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Liquidations ({timeRange})</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liquidationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [name === 'amount' ? `$${(Number(value) / 1000).toFixed(1)}K` : value, name === 'amount' ? 'Amount' : 'Count']} />
                      <Bar dataKey="count" fill="#ef4444" name="Count" />
                      <Bar dataKey="amount" fill="#f59e0b" name="Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Latest Liquidations Ticker */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Liquidations</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Ratio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool Reward</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.liquidations
                      .sort((a, b) => b.liquidated_at - a.liquidated_at)
                      .slice(0, 20)
                      .map((liq) => (
                      <tr key={liq.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(liq.liquidated_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {liq.margin_pool_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(liq.liquidation_amount / 1000).toFixed(1)}K
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {((liq.default_amount / liq.liquidation_amount) * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(liq.pool_reward_amount / 1000).toFixed(1)}K
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
