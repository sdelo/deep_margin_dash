// Clean data contract for the margin dashboard
// This interface defines the exact structure of data expected from any source

export interface MarginManager {
    id: string
    balance_manager_id: string
    owner: string
    created_at: number
}

export interface MarginLoan {
    id: string
    margin_manager_id: string
    margin_pool_id: string
    loan_amount: number
    borrowed_at: number
    repaid_at: number | null
    status: string
}

export interface MarginLiquidation {
    id: string
    margin_manager_id: string
    margin_pool_id: string
    liquidation_amount: number
    pool_reward_amount: number
    liquidator_base_reward: number
    liquidator_quote_reward: number
    default_amount: number
    liquidated_at: number
}

export interface DashboardData {
    managers: MarginManager[]
    loans: MarginLoan[]
    liquidations: MarginLiquidation[]
    lastUpdated?: number
    dataSource: 'api' | 'static'
}

// Data source configuration
export interface DataSourceConfig {
    type: 'api' | 'static'
    apiUrl?: string
    staticDataPath?: string
    refreshInterval?: number // in milliseconds
}
