// DeepBook v3 data types based on Move code structures
// These types represent the exact data structures returned by the Move contracts

export interface PriceInfoObject {
    id: string
    price: string // 9 decimal precision (e.g., "1000000000" = $1.00)
    timestamp: number
    confidence: string
    expo: number
    publish_time: number
}

// Pool Risk Thresholds - mirrors Move contract RiskRatios struct
export interface PoolRiskRatios {
    min_withdraw_risk_ratio: string // 9 decimal precision (e.g., "2000000000" = 2.0x)
    min_borrow_risk_ratio: string   // 9 decimal precision (e.g., "1500000000" = 1.5x)
    liquidation_risk_ratio: string  // 9 decimal precision (e.g., "1200000000" = 1.2x)
    target_liquidation_risk_ratio: string // 9 decimal precision (e.g., "1300000000" = 1.3x)
}

// Pool Configuration - mirrors Move contract PoolConfig struct
export interface PoolConfig {
    base_margin_pool_id: string
    quote_margin_pool_id: string
    risk_ratios: PoolRiskRatios
    user_liquidation_reward: string // 9 decimal precision (e.g., "50000000" = 5%)
    pool_liquidation_reward: string // 9 decimal precision (e.g., "10000000" = 1%)
    enabled: boolean
}

// DeepBook Pool with Risk Configuration
export interface DeepBookPool {
    id: string
    pool_config: PoolConfig
    // Additional pool metadata
    base_asset_type?: string
    quote_asset_type?: string
    created_at?: number
    last_updated?: number
}

export interface ManagerInfo {
    base: {
        asset: string // 9 decimal precision
        debt: string // 9 decimal precision
        usd_asset: string // 9 decimal precision
        usd_debt: string // 9 decimal precision
        liquidation_price: string // 9 decimal precision
    }
    quote: {
        asset: string // 9 decimal precision
        debt: string // 9 decimal precision
        usd_asset: string // 9 decimal precision
        usd_debt: string // 9 decimal precision
        liquidation_price: string // 9 decimal precision
    }
    risk_ratio: string // 9 decimal precision (health factor)
    liquidation_threshold: string // 9 decimal precision
    max_leverage: string // 9 decimal precision
}

export interface MarginManager {
    id: string
    balance_manager_id: string
    margin_pool_id: string | null  // If null, no current loans. If set, this is the ONLY pool with active loans.
    owner: string
    created_at: number
    // Computed fields from manager_info
    manager_info?: ManagerInfo
    // Derived metrics
    net_equity_usd?: string
    borrow_usage?: string
    distance_to_liquidation?: string
    health_status?: 'healthy' | 'warning' | 'danger' | 'liquidatable'
}

export interface MarginPool {
    id: string
    asset_type: string
    total_supply: string
    total_borrow: string
    utilization_rate: string
    base_rate: string
    base_slope: string
    optimal_utilization: string
    excess_slope: string
    last_index_update_timestamp: number
    // Interest calculations
    current_rate?: string
    daily_interest_cost_usd?: string
    weekly_interest_cost_usd?: string
}

export interface InterestAccrualEvent {
    margin_manager_id: string
    margin_pool_id: string | null
    owner: string
    base_interest_accrued: string
    quote_interest_accrued: string
    total_interest_usd: string
    current_base_rate: string
    current_quote_rate: string
    utilization_rate: string
    last_accrual_timestamp: number
    current_timestamp: number
    time_elapsed_ms: number
    daily_interest_cost_usd: string
    weekly_interest_cost_usd: string
}

export interface PositionHealthUpdateEvent {
    margin_manager_id: string
    margin_pool_id: string | null
    owner: string
    base_asset_usd: string
    quote_asset_usd: string
    base_debt_usd: string
    quote_debt_usd: string
    net_equity_usd: string
    risk_ratio: string
    borrow_usage: string
    liquidation_threshold: string
    distance_to_liquidation: string
    interest_accrued_usd: string
    daily_interest_cost_usd: string
    price_impact_base: string
    price_impact_quote: string
    timestamp: number
    oracle_price_base: string
    oracle_price_quote: string
}

export interface LiquidationRiskAlertEvent {
    margin_manager_id: string
    margin_pool_id: string | null
    owner: string
    current_risk_ratio: string
    liquidation_threshold: string
    distance_to_liquidation: string
    health_status: 'warning' | 'danger' | 'liquidatable'
    timestamp: number
    oracle_price_base: string
    oracle_price_quote: string
}

export interface PriceImpactAnalysisEvent {
    margin_manager_id: string
    margin_pool_id: string | null
    owner: string
    price_change_base: string
    price_change_quote: string
    new_risk_ratio: string
    risk_ratio_change: string
    liquidation_price_change_base: string
    liquidation_price_change_quote: string
    timestamp: number
    oracle_price_base: string
    oracle_price_quote: string
}

export interface DeepBookV3Data {
    margin_managers: MarginManager[]
    margin_pools: MarginPool[]
    deepbook_pools: DeepBookPool[] // Pool configurations with risk thresholds
    position_health_events: PositionHealthUpdateEvent[]
    interest_accrual_events: InterestAccrualEvent[]
    liquidation_risk_alerts: LiquidationRiskAlertEvent[]
    price_impact_events: PriceImpactAnalysisEvent[]
    last_updated: number
    data_source: 'static' | 'rpc' | 'events'
}

// Dashboard-specific computed types
export interface PositionSummary {
    manager_id: string
    owner: string
    base_asset_usd: number
    quote_asset_usd: number
    base_debt_usd: number
    quote_debt_usd: number
    net_equity_usd: number
    health_factor: number
    borrow_usage: number
    liquidation_threshold: number
    distance_to_liquidation: number
    daily_interest_cost_usd: number
    health_status: 'healthy' | 'warning' | 'danger' | 'liquidatable'
    last_updated: number
}

export interface DashboardMetrics {
    total_positions: number
    total_net_equity_usd: number
    total_debt_usd: number
    average_health_factor: number
    positions_at_risk: number
    total_daily_interest_cost_usd: number
    last_updated: number
}
