// Lending types based on Move contract structures
// These types represent the exact data structures from the margin trading contracts

// Risk ratios for DeepBook pools
export interface RiskRatios {
    min_withdraw_risk_ratio: string; // 9 decimal precision (e.g., "2000000000" = 2.0x)
    min_borrow_risk_ratio: string;   // 9 decimal precision (e.g., "1500000000" = 1.5x)
    liquidation_risk_ratio: string;  // 9 decimal precision (e.g., "1200000000" = 1.2x)
    target_liquidation_risk_ratio: string; // 9 decimal precision (e.g., "1300000000" = 1.3x)
}

// Pool configuration for DeepBook pools
export interface PoolConfig {
    base_margin_pool_id: string;
    quote_margin_pool_id: string;
    risk_ratios: RiskRatios;
    user_liquidation_reward: string; // 9 decimal precision (e.g., "50000000" = 5%)
    pool_liquidation_reward: string; // 9 decimal precision (e.g., "10000000" = 1%)
    enabled: boolean;
}

// DeepBook pool with configuration
export interface DeepBookPool {
    id: string;
    pool_config: PoolConfig;
    base_asset_type: string;
    quote_asset_type: string;
    created_at: number;
    last_updated: number;
}

// Margin pool state information
export interface State {
    total_supply: string;
    total_borrow: string;
    supply_index: string;
    borrow_index: string;
    last_index_update_timestamp: number;
}

// Interest configuration for margin pools
export interface InterestConfig {
    base_rate: string; // 9 decimal precision
    base_slope: string; // 9 decimal precision
    optimal_utilization: string; // 9 decimal precision
    excess_slope: string; // 9 decimal precision
}

// Protocol configuration for margin pools
export interface ProtocolConfig {
    margin_pool_config: MarginPoolConfig;
    interest_config: InterestConfig;
}

// Margin pool configuration
export interface MarginPoolConfig {
    supply_cap: string;
    max_utilization_rate: string;
    protocol_spread: string; // 9 decimal precision
}

// Main margin pool structure
export interface MarginPool {
    id: string;
    asset_type: string;
    total_supply: string;
    total_borrow: string;
    utilization_rate: string;
    base_rate: string;
    base_slope: string;
    optimal_utilization: string;
    excess_slope: string;
    last_index_update_timestamp: number;
    // Computed fields
    current_rate?: string;
    daily_interest_cost_usd?: string;
    weekly_interest_cost_usd?: string;
    // Additional fields for UI
    supply_cap: string;
    protocol_spread: string;
    protocol_profit: string;
    vault_value: string;
    unique_positions: number;
    allowed_deepbook_pools: string[];
    name: string;
    currency_symbol: string;
}

// Margin manager information
export interface MarginManager {
    id: string;
    owner: string;
    deepbook_pool: string;
    margin_pool_id: string | null;
    base_borrowed_shares: string;
    quote_borrowed_shares: string;
    active_liquidation: boolean;
}

// Asset information for margin positions
export interface AssetInfo {
    asset: string; // Asset amount in native units
    debt: string; // Debt amount in native units
    usd_asset: string; // Asset value in USD
    usd_debt: string; // Debt value in USD
}

// Combined margin manager position information
export interface ManagerInfo {
    base: AssetInfo;
    quote: AssetInfo;
    debt: string;
    asset_usd: string; // Asset value in USD
    debt_usd: string; // Debt value in USD
    risk_ratio: string; // Risk ratio with 9 decimals
    base_per_dollar: string; // Base asset per dollar with 9 decimals
    quote_per_dollar: string; // Quote asset per dollar with 9 decimals
    debt_per_dollar: string; // Debt per dollar with 9 decimals
    user_liquidation_reward: string; // User liquidation reward with 9 decimals
    pool_liquidation_reward: string; // Pool liquidation reward with 9 decimals
    target_ratio: string; // Target ratio with 9 decimals
}

// Margin registry structure
export interface MarginRegistry {
    id: string;
    registry_id: string;
    allowed_versions: string[];
    pool_registry: Record<string, PoolConfig>;
    margin_pools: Record<string, string>;
    allowed_maintainers: string[];
}

// Events
export interface MarginPoolEvent {
    id: string;
    type: 'AssetSupplied' | 'AssetWithdrawn' | 'InterestAccrued' | 'Liquidation';
    margin_pool_id: string;
    asset_type: string;
    supplier: string;
    supply_amount?: string;
    supply_shares?: string;
    withdrawal_amount?: string;
    withdrawal_shares?: string;
    timestamp: number;
    tx_hash: string;
}

// User-specific events
export interface UserEvent {
    id: string;
    type: 'AssetSupplied' | 'AssetWithdrawn';
    margin_pool_id: string;
    asset_type: string;
    supplier: string;
    supply_amount?: string;
    supply_shares?: string;
    withdrawal_amount?: string;
    withdrawal_shares?: string;
    timestamp: number;
    tx_hash: string;
    block_number: string;
}

// User position in a margin pool
export interface UserPosition {
    supply_shares: string;
    supplied_amount: string;
    earned_interest: string;
    apy: string;
    last_updated: number;
    is_active: boolean;
}
