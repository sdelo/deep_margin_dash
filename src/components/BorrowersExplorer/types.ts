import type { MarginManager, DeepBookPool } from '../../types/deepbook'
import type { PositionSummary } from '../../types/deepbook'

export interface BorrowersExplorerProps {
  managers: MarginManager[]
  loans: any[] // TODO: Convert from position_health_events
  liquidations: any[] // TODO: Convert from liquidation_risk_alerts
}

export interface BorrowerData {
  managerId: string
  owner: string
  firstSeen: number
  lastActivity: number
  poolsUsed: string[]
  outstandingDebtByPool: Record<string, number>
  totalOutstandingDebt: number
  borrowCount: number
  repayCount: number
  liquidationCount: number
  defaultSum: number
  repayRatio: number
  // DeepBook v3 enhanced metrics
  deepbookPosition?: PositionSummary
  events: Array<{
    type: 'created' | 'borrow' | 'repay' | 'liquidation'
    timestamp: number
    pool?: string
    amount?: number
    details: any
  }>
}

export interface LoanBucket {
  amount: number
  timestamp: number
  pool: string
}

export interface PortfolioPriceRiskAnalysisProps {
  positionSummaries: PositionSummary[]
  showDeepBookMetrics: boolean
  selectedPoolId: string
  selectedPriceChange: number
  setSelectedPriceChange: (value: number) => void
  currentSuiPrice: number
  expandedBorrower: string | null
  marginManagers: MarginManager[]
  deepbookPools?: DeepBookPool[] // Pool configurations with risk thresholds
}
